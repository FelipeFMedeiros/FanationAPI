import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { bruteForceProtection } from '../middleware/bruteForce';
import { authenticateToken, requireAdmin } from '../middleware/auth';

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
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nome do usuário
 *         password:
 *           type: string
 *           minLength: 4
 *           description: Senha do usuário
 *         description:
 *           type: string
 *           description: Descrição opcional do usuário
 *       example:
 *         name: "João Silva"
 *         password: "senha123"
 *         description: "Usuário da equipe de marketing"
 *
 *     UpdateUserRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID do usuário
 *         name:
 *           type: string
 *           description: Novo nome do usuário
 *         description:
 *           type: string
 *           description: Nova descrição do usuário
 *       example:
 *         userId: "507f1f77bcf86cd799439011"
 *         name: "João Santos"
 *         description: "Gerente de marketing"
 *
 *     DeleteUserRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID do usuário a ser deletado
 *       example:
 *         userId: "507f1f77bcf86cd799439011"
 *
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Senha atual
 *         newPassword:
 *           type: string
 *           minLength: 4
 *           description: Nova senha
 *       example:
 *         currentPassword: "senhaAtual123"
 *         newPassword: "novaSenha456"
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
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT token para autenticação
 *             user:
 *               $ref: '#/components/schemas/UserInfo'
 *
 *     UserDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *         creatorName:
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

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Criar novo usuário
 *     description: Permite que usuários autenticados criem novos usuários
 *     tags: [Gerenciamento de Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: ID do usuário criado
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou ausente
 *       409:
 *         description: Nome de usuário ou senha já existe
 *
 *   get:
 *     summary: Listar todos os usuários
 *     description: Lista todos os usuários do sistema
 *     tags: [Gerenciamento de Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserDetails'
 *       401:
 *         description: Token inválido ou ausente
 */
router.post('/users', authenticateToken, AuthController.createUser);
router.get('/users', authenticateToken, AuthController.listUsers);

/**
 * @swagger
 * /api/auth/users/update:
 *   put:
 *     summary: Atualizar informações do usuário
 *     description: Permite atualizar nome e descrição do usuário (próprio usuário ou admin)
 *     tags: [Gerenciamento de Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão para atualizar este usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.put('/users/update', authenticateToken, AuthController.updateUser);

/**
 * @swagger
 * /api/auth/users/delete:
 *   delete:
 *     summary: Deletar usuário
 *     description: Permite que administradores ou criadores deletem usuários (exceto admin principal e própria conta)
 *     tags: [Gerenciamento de Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteUserRequest'
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       400:
 *         description: ID do usuário é obrigatório
 *       401:
 *         description: Token inválido ou ausente
 *       403:
 *         description: Sem permissão para deletar (admin principal, própria conta, ou permissões insuficientes)
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/users/delete', authenticateToken, AuthController.deleteUser);

console.log('✅ AuthRoutes carregado com sucesso:\t' + new Date().toISOString());

export default router;
