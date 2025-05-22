import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { bruteForceProtection } from '../middleware/bruteForce';
import { authenticateToken } from '../middleware/auth';

console.log('📁 Carregando authRoutes.ts:\t\t' + new Date().toISOString());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           description: Senha para autenticação
 *       example:
 *         password: "senha123"
 *
 *     UserInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *           description: JWT token para autenticação
 *         user:
 *           $ref: '#/components/schemas/UserInfo'
 *         message:
 *           type: string
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realizar login
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Senha incorreta
 *       429:
 *         description: Muitas tentativas de login
 */
router.post('/login', bruteForceProtection, AuthController.login);

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     summary: Validar token de acesso
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: Token inválido ou expirado
 */
router.get('/validate', authenticateToken, AuthController.validateToken);

console.log('✅ AuthRoutes carregado com sucesso:\t' + new Date().toISOString());

export default router;
