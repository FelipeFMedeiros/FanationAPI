import { Router } from 'express';
import { UsersController } from '../controllers/usersController';
import { authenticateToken } from '../middleware/auth';

console.log('📁 Carregando usersRoutes.ts:\t\t' + new Date().toISOString());

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
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
 * /api/users:
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                   description: ID do usuário criado
 *                 message:
 *                   type: string
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserDetails'
 *                 message:
 *                   type: string
 *       401:
 *         description: Token inválido ou ausente
 */
router.post('/', authenticateToken, UsersController.createUser);
router.get('/', authenticateToken, UsersController.listUsers);

/**
 * @swagger
 * /api/users/update:
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
router.put('/update', authenticateToken, UsersController.updateUser);

/**
 * @swagger
 * /api/users/delete:
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
router.delete('/delete', authenticateToken, UsersController.deleteUser);

console.log('✅ UsersRoutes carregado com sucesso:\t' + new Date().toISOString());

export default router;
