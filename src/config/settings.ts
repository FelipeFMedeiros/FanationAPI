import dotenv from 'dotenv';
import { Secret, SignOptions } from 'jsonwebtoken';

dotenv.config();

export const PORT = process.env.PORT || '3000';
export const HOST = process.env.HOST || 'localhost';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Database
export const DATABASE_URL = process.env.DATABASE_URL || '';

// JWT Configuration
export const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default-jwt-secret-for-development';
export const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || '7d'; // 7 days

// Admin Configuration
export const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Rate Limiting Configuration
export const LOGIN_ATTEMPTS_LIMIT = parseInt(process.env.LOGIN_ATTEMPTS_LIMIT || '5');
export const LOGIN_BLOCK_TIME = parseInt(process.env.LOGIN_BLOCK_TIME || '900000'); // 15 minutes

// Função para validar configurações (chama quando necessário, não no import)
export const validateSettings = (): void => {
    const errors: string[] = [];

    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required in production');
    }

    if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET is required in production');
    }

    if (!process.env.ADMIN_PASSWORD) {
        errors.push('ADMIN_PASSWORD is required in production');
    }

    if (errors.length > 0 && NODE_ENV === 'production') {
        console.error('❌ Missing required environment variables:');
        errors.forEach(error => console.error(`   - ${error}`));
        throw new Error('Missing required environment variables');
    }

    if (errors.length > 0 && NODE_ENV === 'development') {
        console.warn('⚠️  Using default values for missing environment variables:');
        errors.forEach(error => console.warn(`   - ${error}`));
    }
};

// Log das configurações carregadas
console.log('⚙️ Env carregado:\n');
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   HOST: ${HOST}`);
console.log(`   PORT: ${PORT}`);
console.log(`   JWT_SECRET: ${JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
console.log(`   ADMIN_PASSWORD: ${ADMIN_PASSWORD ? '✅ Set' : '❌ Missing'}`);
console.log(`   DATABASE_URL: ${DATABASE_URL ? '✅ Set' : '❌ Missing'}\n`);