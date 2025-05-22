import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_SECRET, JWT_EXPIRES_IN, ADMIN_PASSWORD, ADMIN_NAME } from '../config/settings';
import {
    LoginRequest,
    LoginResponse,
    CreateUserRequest,
    CreateUserResponse,
    UpdateUserRequest,
    UpdateUserResponse,
    DeleteUserRequest,
    DeleteUserResponse,
    ListUsersResponse,
    AuthenticatedRequest,
} from '../types/auth';
import { recordLoginAttempt } from '../middleware/bruteForce';

export class AuthController {
    static async initializeAdmin(): Promise<void> {
        try {
            const existingAdmin = await prisma.user.findFirst({
                where: { role: 'admin' },
            });

            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                await prisma.user.create({
                    data: {
                        name: ADMIN_NAME,
                        password: hashedPassword,
                        role: 'admin',
                        description: 'Administrador principal do sistema',
                    },
                });
                console.log('✅ Admin principal criado com sucesso!');
            } else {
                console.log('ℹ️  Admin principal já existe no banco de dados');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar admin:', error);
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { password }: LoginRequest = req.body;
            const clientIP = (req as any).clientIP || 'unknown';

            // Validação básica
            if (!password) {
                await recordLoginAttempt(clientIP, false);
                res.status(400).json({
                    success: false,
                    message: 'Senha é obrigatória',
                    error: 'MISSING_PASSWORD',
                } as LoginResponse);
                return;
            }

            // Buscar todos os usuários
            const users = await prisma.user.findMany();
            let authenticatedUser = null;

            // Verificar senha contra todos os usuários
            for (const user of users) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    authenticatedUser = user;
                    break;
                }
            }

            if (!authenticatedUser) {
                await recordLoginAttempt(clientIP, false);
                res.status(401).json({
                    success: false,
                    message: 'Senha incorreta',
                    error: 'INVALID_PASSWORD',
                } as LoginResponse);
                return;
            }

            // Gerar token JWT
            const token = jwt.sign(
                {
                    userId: authenticatedUser.id,
                    userName: authenticatedUser.name,
                    userRole: authenticatedUser.role,
                },
                JWT_SECRET as string,
                { expiresIn: JWT_EXPIRES_IN },
            );

            // Registrar sucesso na tentativa de login
            await recordLoginAttempt(clientIP, true);

            res.status(200).json({
                success: true,
                token,
                user: {
                    id: authenticatedUser.id,
                    name: authenticatedUser.name,
                    role: authenticatedUser.role,
                },
                message: `Login realizado com sucesso`,
            } as LoginResponse);
        } catch (error) {
            console.error('❌ Erro no login:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as LoginResponse);
        }
    }

    static async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { name, password, description }: CreateUserRequest = req.body;
            const createdBy = (req as AuthenticatedRequest).userId;

            // Validação básica
            if (!name || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Nome e senha são obrigatórios',
                    error: 'MISSING_REQUIRED_FIELDS',
                } as CreateUserResponse);
                return;
            }

            if (password.length < 4) {
                res.status(400).json({
                    success: false,
                    message: 'Senha deve ter pelo menos 4 caracteres',
                    error: 'PASSWORD_TOO_SHORT',
                } as CreateUserResponse);
                return;
            }

            // Verificar se já existe usuário com o mesmo nome
            const existingUser = await prisma.user.findFirst({
                where: { name },
            });

            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Já existe um usuário com este nome',
                    error: 'USER_NAME_EXISTS',
                } as CreateUserResponse);
                return;
            }

            // Verificar se a senha já existe
            const allUsers = await prisma.user.findMany();
            for (const user of allUsers) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    res.status(409).json({
                        success: false,
                        message: 'Esta senha já está sendo usada por outro usuário',
                        error: 'PASSWORD_ALREADY_EXISTS',
                    } as CreateUserResponse);
                    return;
                }
            }

            // Criptografar e salvar o novo usuário
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await prisma.user.create({
                data: {
                    name,
                    password: hashedPassword,
                    role: 'user',
                    description: description || null,
                    createdBy: createdBy || null,
                },
            });

            res.status(201).json({
                success: true,
                userId: newUser.id,
                message: 'Usuário criado com sucesso',
            } as CreateUserResponse);
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as CreateUserResponse);
        }
    }

    static async listUsers(req: Request, res: Response): Promise<void> {
        try {
            // Buscar todos os usuários
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    role: true,
                    description: true,
                    createdAt: true,
                    createdBy: true,
                },
                orderBy: [
                    { role: 'desc' }, // Admin primeiro
                    { createdAt: 'desc' },
                ],
            });

            // Coletando todos os IDs de criadores únicos
            const creatorIds = [...new Set(users.map((u) => u.createdBy).filter((id) => id))];

            // Buscar usuários que criaram outros usuários
            const creators = await prisma.user.findMany({
                where: {
                    id: {
                        in: creatorIds as string[],
                    },
                },
                select: {
                    id: true,
                    name: true,
                },
            });

            // Criar mapeamento de ID para nome
            const creatorMap = new Map();
            creators.forEach((creator) => {
                creatorMap.set(creator.id, creator.name);
            });

            res.status(200).json({
                success: true,
                users: users.map((user) => ({
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    description: user.description,
                    createdAt: user.createdAt.toISOString(),
                    createdBy: user.createdBy,
                    creatorName: user.createdBy ? creatorMap.get(user.createdBy) || 'Sistema' : null,
                })),
                message: 'Usuários listados com sucesso',
            } as ListUsersResponse);
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as ListUsersResponse);
        }
    }

    static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId, name, description }: UpdateUserRequest = req.body;
            const requestingUserId = (req as AuthenticatedRequest).userId;
            const requestingUserRole = (req as AuthenticatedRequest).userRole;

            // Validação básica
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'ID do usuário é obrigatório',
                    error: 'MISSING_USER_ID',
                } as UpdateUserResponse);
                return;
            }

            // Verificar se o usuário existe
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado',
                    error: 'USER_NOT_FOUND',
                } as UpdateUserResponse);
                return;
            }

            // Verificar permissões - só admin ou o próprio usuário pode atualizar
            if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Sem permissão para atualizar este usuário',
                    error: 'INSUFFICIENT_PERMISSIONS',
                } as UpdateUserResponse);
                return;
            }

            // Verificar se o novo nome já existe (se fornecido)
            if (name && name !== existingUser.name) {
                const nameExists = await prisma.user.findFirst({
                    where: {
                        name,
                        id: { not: userId },
                    },
                });

                if (nameExists) {
                    res.status(409).json({
                        success: false,
                        message: 'Já existe um usuário com este nome',
                        error: 'USER_NAME_EXISTS',
                    } as UpdateUserResponse);
                    return;
                }
            }

            // Atualizar usuário
            const updateData: any = { updatedAt: new Date() };
            if (name) updateData.name = name;
            if (description !== undefined) updateData.description = description;

            await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });

            res.status(200).json({
                success: true,
                message: 'Usuário atualizado com sucesso',
            } as UpdateUserResponse);
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as UpdateUserResponse);
        }
    }

    static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId }: DeleteUserRequest = req.body;
            const requestingUserId = (req as AuthenticatedRequest).userId;
            const requestingUserRole = (req as AuthenticatedRequest).userRole;

            // Validação básica
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'ID do usuário é obrigatório',
                    error: 'MISSING_USER_ID',
                } as DeleteUserResponse);
                return;
            }

            // Verificar se o usuário existe
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!existingUser) {
                res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado',
                    error: 'USER_NOT_FOUND',
                } as DeleteUserResponse);
                return;
            }

            // Não permitir deletar admin principal
            if (existingUser.role === 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Não é possível deletar o administrador principal',
                    error: 'CANNOT_DELETE_ADMIN',
                } as DeleteUserResponse);
                return;
            }

            // Não permitir que usuário delete a si mesmo
            if (requestingUserId === userId) {
                res.status(403).json({
                    success: false,
                    message: 'Não é possível deletar sua própria conta',
                    error: 'CANNOT_DELETE_SELF',
                } as DeleteUserResponse);
                return;
            }

            // Verificar permissões - apenas admin ou o criador do usuário pode deletar
            const canDelete = requestingUserRole === 'admin' || existingUser.createdBy === requestingUserId;

            if (!canDelete) {
                res.status(403).json({
                    success: false,
                    message:
                        'Sem permissão para deletar este usuário. Apenas administradores ou quem criou o usuário podem deletá-lo.',
                    error: 'INSUFFICIENT_PERMISSIONS',
                } as DeleteUserResponse);
                return;
            }

            // Deletar o usuário
            await prisma.user.delete({
                where: { id: userId },
            });

            res.status(200).json({
                success: true,
                message: 'Usuário deletado com sucesso',
            } as DeleteUserResponse);
        } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as DeleteUserResponse);
        }
    }

    static async validateToken(req: Request, res: Response): Promise<void> {
        try {
            const authReq = req as AuthenticatedRequest;

            res.status(200).json({
                success: true,
                message: 'Token válido',
                user: {
                    id: authReq.userId,
                    name: authReq.userName,
                    role: authReq.userRole,
                },
            });
        } catch (error) {
            console.error('❌ Erro ao validar token:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            });
        }
    }
}
