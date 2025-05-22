import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LOGIN_ATTEMPTS_LIMIT, LOGIN_BLOCK_TIME } from '../config/settings';

export const bruteForceProtection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

        // Buscar tentativas de login para este IP
        const loginAttempt = await prisma.loginAttempt.findFirst({
            where: { ip: clientIP },
        });

        // Verificar se o IP está bloqueado
        if (loginAttempt?.blockedAt && loginAttempt.expiresAt > new Date()) {
            const remainingTime = Math.ceil((loginAttempt.expiresAt.getTime() - Date.now()) / 1000 / 60);
            res.status(429).json({
                success: false,
                message: `IP bloqueado devido a muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`,
                error: 'TOO_MANY_ATTEMPTS',
            });
            return;
        }

        // Se o bloqueio expirou, limpar o registro
        if (loginAttempt?.blockedAt && loginAttempt.expiresAt <= new Date()) {
            await prisma.loginAttempt.delete({
                where: { id: loginAttempt.id },
            });
        }

        // Adicionar IP ao request para uso posterior
        (req as any).clientIP = clientIP;
        next();
    } catch (error) {
        console.error('Erro no middleware de brute force:', error);
        next();
    }
};

export const recordLoginAttempt = async (ip: string, success: boolean): Promise<void> => {
    try {
        if (success) {
            // Se o login foi bem-sucedido, remover tentativas anteriores
            await prisma.loginAttempt.deleteMany({
                where: { ip },
            });
            return;
        }

        // Buscar ou criar registro de tentativas
        const existingAttempt = await prisma.loginAttempt.findFirst({
            where: { ip },
        });

        if (existingAttempt) {
            const newAttempts = existingAttempt.attempts + 1;
            const shouldBlock = newAttempts >= LOGIN_ATTEMPTS_LIMIT;

            await prisma.loginAttempt.update({
                where: { id: existingAttempt.id },
                data: {
                    attempts: newAttempts,
                    blockedAt: shouldBlock ? new Date() : null,
                    expiresAt: shouldBlock ? new Date(Date.now() + LOGIN_BLOCK_TIME) : existingAttempt.expiresAt,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Primeira tentativa falhada
            await prisma.loginAttempt.create({
                data: {
                    ip,
                    attempts: 1,
                    expiresAt: new Date(Date.now() + LOGIN_BLOCK_TIME),
                },
            });
        }
    } catch (error) {
        console.error('Erro ao registrar tentativa de login:', error);
    }
};
