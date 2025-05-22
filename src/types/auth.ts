import { Request } from 'express';

export interface LoginRequest {
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        name: string;
        role: string;
    };
    message: string;
}

export interface JwtPayload {
    userId: string;
    userName: string;
    userRole: string;
    iat?: number;
    exp?: number;
}

// Extensão do Request do Express usando module augmentation
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userName?: string;
            userRole?: string;
        }
    }
}

// Interface para uso nos controllers (opcional)
export interface AuthenticatedRequest extends Request {
    userId: string;
    userName: string;
    userRole: string;
}