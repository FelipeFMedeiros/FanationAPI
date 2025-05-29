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
 *     summary: Listar usuários com busca e ordenação
 *     description: Lista todos os usuários do sistema com opções de busca por nome e ordenação por diferentes campos
 *     tags: [Gerenciamento de Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar usuários por nome (case-insensitive)
 *         example: "João"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [role, name, createdAt]
 *           default: role
 *         description: Campo para ordenação dos resultados
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da classificação (crescente ou decrescente)
 *     responses:
 *       200:
 *         description: Lista de usuários com filtros aplicados
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
 *                 total:
 *                   type: number
 *                   description: Número total de usuários encontrados
 *                 filters:
 *                   type: object
 *                   properties:
 *                     search:
 *                       type: string
 *                       nullable: true
 *                       description: Termo de busca aplicado
 *                     sortBy:
 *                       type: string
 *                       description: Campo usado para ordenação
 *                     sortOrder:
 *                       type: string
 *                       description: Ordem de classificação aplicada
 *                 message:
 *                   type: string
 *                   description: Mensagem dinâmica baseada nos filtros aplicados
 *               example:
 *                 success: true
 *                 users:
 *                   - id: "507f1f77bcf86cd799439011"
 *                     name: "Administrador"
 *                     role: "admin"
 *                     description: "Usuário administrador do sistema"
 *                     createdAt: "2024-01-01T10:00:00.000Z"
 *                     createdBy: null
 *                     creatorName: null
 *                   - id: "507f1f77bcf86cd799439012"
 *                     name: "João Silva"
 *                     role: "user"
 *                     description: "Usuário comum"
 *                     createdAt: "2024-01-02T10:00:00.000Z"
 *                     createdBy: "507f1f77bcf86cd799439011"
 *                     creatorName: "Administrador"
 *                 total: 2
 *                 filters:
 *                   search: null
 *                   sortBy: "role"
 *                   sortOrder: "desc"
 *                 message: "Usuários listados com sucesso"
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
 *     description: Permite que administradores deletem qualquer usuário comum, ou que usuários comuns deletem outros usuários comuns que criaram. Administradores não podem ser deletados por usuários comuns.
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
 *         description: Sem permissão para deletar este usuário. Possíveis motivos - tentativa de deletar administrador, própria conta, ou usuário que não foi criado por você
 *       404:
 *         description: Usuário não encontrado
 */
router.delete('/delete', authenticateToken, UsersController.deleteUser);

console.log('✅ UsersRoutes carregado com sucesso:\t' + new Date().toISOString());

export default router;
