import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import {
    CreateUserRequest,
    CreateUserResponse,
    UpdateUserRequest,
    UpdateUserResponse,
    DeleteUserRequest,
    DeleteUserResponse,
    ListUsersResponse,
} from '../types/users';

export class UsersController {
    static async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { name, password, description }: CreateUserRequest = req.body;
            const createdBy = req.userId;

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
            // Extrair parâmetros de query
            const { search, sortBy = 'role', sortOrder = 'desc' } = req.query;

            // Validar parâmetros de ordenação
            const validSortFields = ['role', 'name', 'createdAt'];
            const validSortOrders = ['asc', 'desc'];

            const finalSortBy = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'role';
            const finalSortOrder = validSortOrders.includes(sortOrder as string)
                ? (sortOrder as 'asc' | 'desc')
                : 'desc';

            // Construir filtro de busca
            const whereClause: any = {};
            if (search && typeof search === 'string' && search.trim()) {
                whereClause.name = {
                    contains: search.trim(),
                    mode: 'insensitive', // Ignorar maiúsculas/minúsculas
                };
            }

            // Construir ordenação
            let orderBy: any[] = [];

            if (finalSortBy === 'role') {
                // Para role, sempre mostrar admin primeiro, depois ordenar por nome
                orderBy = [
                    { role: finalSortOrder },
                    { name: 'asc' }, // Nome sempre crescente como critério secundário
                ];
            } else if (finalSortBy === 'name') {
                orderBy = [
                    { name: finalSortOrder },
                    { role: 'desc' }, // Role como critério secundário
                ];
            } else if (finalSortBy === 'createdAt') {
                orderBy = [
                    { createdAt: finalSortOrder },
                    { name: 'asc' }, // Nome como critério secundário
                ];
            }

            // Buscar usuários com filtros e ordenação
            const users = await prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    description: true,
                    createdAt: true,
                    createdBy: true,
                },
                orderBy,
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

            // Preparar resposta com informações de filtros aplicados
            const responseData = {
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
                total: users.length,
                filters: {
                    search: search || null,
                    sortBy: finalSortBy,
                    sortOrder: finalSortOrder,
                },
                message: search
                    ? `${users.length} usuário(s) encontrado(s) para "${search}"`
                    : 'Usuários listados com sucesso',
            };

            res.status(200).json(responseData as ListUsersResponse);
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
            const requestingUserId = req.userId;
            const requestingUserRole = req.userRole;

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

            // Permissões:
            // - Admin pode atualizar qualquer usuário
            // - Usuário comum pode atualizar:
            //   - Ele mesmo
            //   - Outros usuários comuns que ele criou
            let canUpdate = false;
            if (requestingUserRole === 'admin') {
                canUpdate = true;
            } else if (requestingUserRole === 'user') {
                canUpdate =
                    requestingUserId === userId ||
                    (existingUser.role === 'user' && existingUser.createdBy === requestingUserId);
            }

            if (!canUpdate) {
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
            const requestingUserId = req.userId;
            const requestingUserRole = req.userRole;

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

            // CORREÇÃO: Verificar permissões com segurança adicional
            // Apenas admin pode deletar qualquer usuário
            // Usuários comuns só podem deletar outros usuários comuns que criaram
            let canDelete = false;

            if (requestingUserRole === 'admin') {
                // Admin pode deletar qualquer usuário (exceto outros admins, já verificado acima)
                canDelete = true;
            } else if (requestingUserRole === 'user') {
                // Usuário comum só pode deletar outros usuários comuns que ele criou
                canDelete = existingUser.role === 'user' && existingUser.createdBy === requestingUserId;
            }

            if (!canDelete) {
                res.status(403).json({
                    success: false,
                    message:
                        'Sem permissão para deletar este usuário. Apenas administradores podem deletar administradores.',
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
}
