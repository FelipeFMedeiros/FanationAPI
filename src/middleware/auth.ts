import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/settings';
import { JwtPayload } from '../types/auth';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Token de acesso requerido',
            error: 'MISSING_TOKEN',
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Agora podemos adicionar diretamente ao req sem cast
        req.userId = decoded.userId;
        req.userName = decoded.userName;
        req.userRole = decoded.userRole;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expirado',
                error: 'TOKEN_EXPIRED',
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({
                success: false,
                message: 'Token inválido',
                error: 'INVALID_TOKEN',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: 'INTERNAL_ERROR',
        });
    }
};

// Middleware adicional para verificar se é admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (req.userRole !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Acesso negado. Privilégios de administrador necessários.',
            error: 'ADMIN_REQUIRED',
        });
        return;
    }

    next();
};
