import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/settings';
import { JwtPayload, AuthenticatedRequest } from '../types/auth';

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
        (req as unknown as AuthenticatedRequest).adminId = decoded.adminId;
        (req as unknown as AuthenticatedRequest).adminName = decoded.adminName;
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
