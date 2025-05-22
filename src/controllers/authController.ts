import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_SECRET, JWT_EXPIRES_IN, ADMIN_PASSWORD, ADMIN_NAME } from '../config/settings';
import {
    LoginRequest,
    LoginResponse,
    CreatePasswordRequest,
    CreatePasswordResponse,
    DeletePasswordRequest,
    DeletePasswordResponse,
    ListPasswordsResponse,
    AuthenticatedRequest,
} from '../types/auth';
import { recordLoginAttempt } from '../middleware/bruteForce';

export class AuthController {
    static async initializeAdmin(): Promise<void> {
        try {
            const existingAdmin = await prisma.admin.findFirst();

            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
                await prisma.admin.create({
                    data: {
                        name: ADMIN_NAME,
                        password: hashedPassword,
                    },
                });
                console.log('✅ Admin criado com sucesso!');
            } else {
                console.log('ℹ️  Admin já existe no banco de dados');
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

            // Verificar se a senha é a senha do admin principal
            const admin = await prisma.admin.findFirst();
            let isValidPassword = false;
            let loginSource = '';

            if (admin) {
                const isAdminPassword = await bcrypt.compare(password, admin.password);
                if (isAdminPassword) {
                    isValidPassword = true;
                    loginSource = 'admin';
                }
            }

            // Se não for a senha do admin, verificar nas senhas criadas
            if (!isValidPassword) {
                const savedPasswords = await prisma.password.findMany();
                let matchedPassword = null; // Adicione esta variável

                for (const savedPassword of savedPasswords) {
                    const isMatch = await bcrypt.compare(password, savedPassword.password);
                    if (isMatch) {
                        isValidPassword = true;
                        loginSource = 'custom';
                        matchedPassword = savedPassword; // Guarde a senha encontrada
                        break;
                    }
                }

                // Gerar token JWT
                const token = jwt.sign(
                    {
                        adminId: matchedPassword ? matchedPassword.id : admin?.id || 'system',
                        adminName: loginSource === 'custom' ? matchedPassword?.name : admin?.name || ADMIN_NAME,
                    },
                    JWT_SECRET as string,
                    { expiresIn: JWT_EXPIRES_IN },
                );

                // Resposta
                res.status(200).json({
                    success: true,
                    token,
                    adminName: loginSource === 'custom' ? matchedPassword?.name : admin?.name || ADMIN_NAME,
                    message: `Login realizado com sucesso (${loginSource})`,
                } as LoginResponse);
            }

            if (!isValidPassword) {
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
                    adminId: admin?.id || 'system',
                    adminName: admin?.name || ADMIN_NAME,
                },
                JWT_SECRET as string,
                { expiresIn: JWT_EXPIRES_IN },
            );

            // Registrar sucesso na tentativa de login
            await recordLoginAttempt(clientIP, true);

            res.status(200).json({
                success: true,
                token,
                adminName: admin?.name || ADMIN_NAME,
                message: `Login realizado com sucesso (${loginSource})`,
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

    static async createPassword(req: Request, res: Response): Promise<void> {
        try {
            const { password, name, description }: CreatePasswordRequest = req.body;
            const createdBy = (req as unknown as AuthenticatedRequest).adminId;

            // Validação básica
            if (!password) {
                res.status(400).json({
                    success: false,
                    message: 'Senha é obrigatória',
                    error: 'MISSING_PASSWORD',
                } as CreatePasswordResponse);
                return;
            }

            if (!name) {
                res.status(400).json({
                    success: false,
                    message: 'Nome é obrigatório',
                    error: 'MISSING_NAME',
                } as CreatePasswordResponse);
                return;
            }

            if (password.length < 4) {
                res.status(400).json({
                    success: false,
                    message: 'Senha deve ter pelo menos 4 caracteres',
                    error: 'PASSWORD_TOO_SHORT',
                } as CreatePasswordResponse);
                return;
            }

            // Verificar se a senha já existe
            const existingPasswords = await prisma.password.findMany();
            for (const existingPassword of existingPasswords) {
                const isMatch = await bcrypt.compare(password, existingPassword.password);
                if (isMatch) {
                    res.status(409).json({
                        success: false,
                        message: 'Esta senha já existe',
                        error: 'PASSWORD_ALREADY_EXISTS',
                    } as CreatePasswordResponse);
                    return;
                }
            }

            // Criptografar e salvar a nova senha
            const hashedPassword = await bcrypt.hash(password, 12);
            const newPassword = await prisma.password.create({
                data: {
                    password: hashedPassword,
                    name: name,
                    description: description || null,
                    createdBy: createdBy || null,
                },
            });

            res.status(201).json({
                success: true,
                passwordId: newPassword.id,
                message: 'Senha criada com sucesso',
            } as CreatePasswordResponse);
        } catch (error) {
            console.error('❌ Erro ao criar senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as CreatePasswordResponse);
        }
    }

    static async deletePassword(req: Request, res: Response): Promise<void> {
        try {
            const { passwordId }: DeletePasswordRequest = req.body;

            // Validação básica
            if (!passwordId) {
                res.status(400).json({
                    success: false,
                    message: 'ID da senha é obrigatório',
                    error: 'MISSING_PASSWORD_ID',
                } as DeletePasswordResponse);
                return;
            }

            // Verificar se a senha existe
            const existingPassword = await prisma.password.findUnique({
                where: { id: passwordId },
            });

            if (!existingPassword) {
                res.status(404).json({
                    success: false,
                    message: 'Senha não encontrada',
                    error: 'PASSWORD_NOT_FOUND',
                } as DeletePasswordResponse);
                return;
            }

            // Deletar a senha
            await prisma.password.delete({
                where: { id: passwordId },
            });

            res.status(200).json({
                success: true,
                message: 'Senha deletada com sucesso',
            } as DeletePasswordResponse);
        } catch (error) {
            console.error('❌ Erro ao deletar senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as DeletePasswordResponse);
        }
    }

    static async listPasswords(req: Request, res: Response): Promise<void> {
        try {
            // Buscar todas as senhas
            const passwords = await prisma.password.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    createdBy: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // Coletando todos os IDs de criadores únicos para buscar seus nomes
            const creatorIds = [...new Set(passwords.map((p) => p.createdBy).filter((id) => id))];

            // Buscar admins que criaram senhas
            const creators = await prisma.admin.findMany({
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

            // Formatar a resposta
            res.status(200).json({
                success: true,
                passwords: passwords.map((pwd) => ({
                    id: pwd.id,
                    name: pwd.name,
                    description: pwd.description,
                    createdAt: pwd.createdAt.toISOString(),
                    createdBy: pwd.createdBy,
                    creatorName: pwd.createdBy ? creatorMap.get(pwd.createdBy) || ADMIN_NAME : null,
                })),
                message: 'Senhas listadas com sucesso',
            } as ListPasswordsResponse);
        } catch (error) {
            console.error('❌ Erro ao listar senhas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            } as ListPasswordsResponse);
        }
    }

    static async validateToken(req: Request, res: Response): Promise<void> {
        try {
            // Se chegou até aqui, o token é válido (middleware authenticateToken)
            const authReq = req as unknown as AuthenticatedRequest;

            res.status(200).json({
                success: true,
                message: 'Token válido',
                adminName: authReq.adminName || ADMIN_NAME, // Usar ADMIN_NAME como fallback
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

    static async updatePassword(req: Request, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Senha atual e nova senha são obrigatórias',
                    error: 'MISSING_PASSWORDS',
                });
                return;
            }

            if (newPassword.length < 6) {
                res.status(400).json({
                    success: false,
                    message: 'Nova senha deve ter pelo menos 6 caracteres',
                    error: 'PASSWORD_TOO_SHORT',
                });
                return;
            }

            const admin = await prisma.admin.findFirst();

            if (!admin) {
                res.status(500).json({
                    success: false,
                    message: 'Admin não encontrado',
                    error: 'ADMIN_NOT_FOUND',
                });
                return;
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);

            if (!isCurrentPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Senha atual incorreta',
                    error: 'INVALID_CURRENT_PASSWORD',
                });
                return;
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            await prisma.admin.update({
                where: { id: admin.id },
                data: { password: hashedNewPassword },
            });

            res.status(200).json({
                success: true,
                message: 'Senha atualizada com sucesso',
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar senha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'INTERNAL_ERROR',
            });
        }
    }
}
