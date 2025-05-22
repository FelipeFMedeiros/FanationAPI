import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_SECRET, JWT_EXPIRES_IN, ADMIN_PASSWORD, ADMIN_NAME } from '../config/settings';
import { LoginRequest, LoginResponse } from '../types/auth';
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

    static async validateToken(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                success: true,
                message: 'Token válido',
                user: {
                    id: req.userId,
                    name: req.userName,
                    role: req.userRole,
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
