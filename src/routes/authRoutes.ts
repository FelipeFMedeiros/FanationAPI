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
 *     CreatePasswordRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           minLength: 4
 *           description: Nova senha a ser criada
 *         description:
 *           type: string
 *           description: Descrição opcional da senha
 *         name:
 *          type: string
 *          description: Nome da senha
 *       example:
 *         password: "novaSenha123"
 *         name: "Senha de marketing"
 *         description: "Senha para equipe de marketing"
 *
 *     DeletePasswordRequest:
 *       type: object
 *       required:
 *         - passwordId
 *       properties:
 *         passwordId:
 *           type: string
 *           description: ID da senha a ser deletada
 *       example:
 *         passwordId: "507f1f77bcf86cd799439011"
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
 *
 *     LoginResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT token para autenticação
 *             adminName:
 *               type: string
 *               description: Nome do administrador autenticado
 *
 *     PasswordInfo:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           description: ID do administrador que criou
 *         creatorName:
 *           type: string
 *           description: Nome do administrador que criou
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Senha incorreta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       429:
 *         description: Muitas tentativas de login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/login', bruteForceProtection, AuthController.login);

/**
 * @swagger
 * /api/auth/passwords:
 *   post:
 *     summary: Criar nova senha
 *     description: Permite que usuários autenticados criem novas senhas válidas para login
 *     tags: [Gerenciamento de Senhas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePasswordRequest'
 *     responses:
 *       201:
 *         description: Senha criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     passwordId:
 *                       type: string
 *                       description: ID da senha criada
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       409:
 *         description: Senha já existe
 *
 *   get:
 *     summary: Listar todas as senhas
 *     description: Lista todas as senhas criadas (sem mostrar as senhas em si)
 *     tags: [Gerenciamento de Senhas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de senhas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     passwords:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PasswordInfo'
 *       401:
 *         description: Token inválido ou ausente
 */
router.post('/passwords', authenticateToken, AuthController.createPassword);
router.get('/passwords', authenticateToken, AuthController.listPasswords);

/**
 * @swagger
 * /api/auth/passwords/delete:
 *   delete:
 *     summary: Deletar senha
 *     description: Permite que qualquer pessoa delete senhas criadas (não requer autenticação)
 *     tags: [Gerenciamento de Senhas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeletePasswordRequest'
 *     responses:
 *       200:
 *         description: Senha deletada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: ID da senha é obrigatório
 *       404:
 *         description: Senha não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/passwords/delete', AuthController.deletePassword);

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
 *                     adminName:
 *                       type: string
 *                       description: Nome do administrador
 */
router.get('/validate', authenticateToken, AuthController.validateToken);

/**
 * @swagger
 * /api/auth/update-password:
 *   put:
 *     summary: Atualizar senha
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       401:
 *         description: Senha atual incorreta
 */
router.put('/update-password', authenticateToken, AuthController.updatePassword);

console.log('✅ AuthRoutes carregado com sucesso:\t' + new Date().toISOString());

export default router;
