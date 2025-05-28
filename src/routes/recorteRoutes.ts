import express from 'express';
import { RecorteController } from '../controllers/recorteController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Recorte:
 *       type: object
 *       required:
 *         - nome
 *         - ordem
 *         - sku
 *         - tipoRecorte
 *         - posicao
 *         - tipoProduto
 *         - material
 *         - cor
 *         - urlImagem
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do recorte
 *         nome:
 *           type: string
 *           description: Nome do recorte
 *         ordem:
 *           type: integer
 *           description: Ordem de exibição nas camadas
 *         sku:
 *           type: string
 *           description: Código único do recorte
 *         tipoRecorte:
 *           type: string
 *           enum: [frente, aba, lateral]
 *           description: Tipo do recorte
 *         posicao:
 *           type: string
 *           enum: [frente, traseira]
 *           description: Posição do recorte
 *         tipoProduto:
 *           type: string
 *           enum: [americano, trucker]
 *           description: Tipo do produto
 *         material:
 *           type: string
 *           enum: [linho]
 *           description: Material do recorte
 *         cor:
 *           type: string
 *           enum: [azul marinho, laranja]
 *           description: Cor do material
 *         urlImagem:
 *           type: string
 *           description: URL da imagem no Cloudinary
 *         status:
 *           type: boolean
 *           description: Status do recorte (true = ativo, false = inativo)
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *       example:
 *         id: "507f1f77bcf86cd799439011"
 *         nome: "Aba Frontal"
 *         ordem: 1
 *         sku: "BONE001"
 *         tipoRecorte: "frente"
 *         posicao: "frente"
 *         tipoProduto: "americano"
 *         material: "linho"
 *         cor: "azul marinho"
 *         urlImagem: "https://res.cloudinary.com/..."
 *         status: true
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-01T00:00:00.000Z"
 *
 *     RecorteCreate:
 *       type: object
 *       required:
 *         - nome
 *         - ordem
 *         - sku
 *         - tipoRecorte
 *         - posicao
 *         - tipoProduto
 *         - material
 *         - cor
 *         - urlImagem
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do recorte
 *         ordem:
 *           type: integer
 *           description: Ordem de exibição nas camadas
 *         sku:
 *           type: string
 *           description: Código único do recorte
 *         tipoRecorte:
 *           type: string
 *           enum: [frente, aba, lateral]
 *         posicao:
 *           type: string
 *           enum: [frente, traseira]
 *         tipoProduto:
 *           type: string
 *           enum: [americano, trucker]
 *         material:
 *           type: string
 *           enum: [linho]
 *         cor:
 *           type: string
 *           enum: [azul marinho, laranja]
 *         urlImagem:
 *           type: string
 *           description: URL da imagem (obrigatória)
 *         status:
 *           type: boolean
 *           description: Status do recorte (true = ativo, false = inativo)
 *           default: true
 *
 *     RecorteUpdate:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome do recorte
 *         ordem:
 *           type: integer
 *           description: Ordem de exibição nas camadas
 *         sku:
 *           type: string
 *           description: Código único do recorte
 *         tipoRecorte:
 *           type: string
 *           enum: [frente, aba, lateral]
 *         posicao:
 *           type: string
 *           enum: [frente, traseira]
 *         tipoProduto:
 *           type: string
 *           enum: [americano, trucker]
 *         material:
 *           type: string
 *           enum: [linho]
 *         cor:
 *           type: string
 *           enum: [azul marinho, laranja]
 *         urlImagem:
 *           type: string
 *           description: URL da imagem
 *         status:
 *           type: boolean
 *           description: Status do recorte (true = ativo, false = inativo)
 */

/**
 * @swagger
 * /api/recortes/upload:
 *   post:
 *     summary: Upload de imagem para Cloudinary
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - tipoProduto
 *               - tipoRecorte
 *               - material
 *               - cor
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem
 *               tipoProduto:
 *                 type: string
 *                 enum: [americano, trucker]
 *               tipoRecorte:
 *                 type: string
 *                 enum: [frente, aba, lateral]
 *               material:
 *                 type: string
 *                 enum: [linho]
 *               cor:
 *                 type: string
 *                 enum: [azul marinho, laranja]
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                     publicId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *       400:
 *         description: Dados inválidos ou arquivo não enviado
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/upload', authenticateToken, upload.single('image'), handleUploadError, RecorteController.uploadImage);

/**
 * @swagger
 * /api/recortes:
 *   post:
 *     summary: Criar novo recorte
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecorteCreate'
 *     responses:
 *       201:
 *         description: Recorte criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recorte'
 *       400:
 *         description: Dados inválidos (campos obrigatórios, SKU ou URL da imagem faltando)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   enum: [MISSING_REQUIRED_FIELDS, SKU_REQUIRED, IMAGE_REQUIRED, INVALID_TIPO_RECORTE, INVALID_POSICAO, INVALID_TIPO_PRODUTO, INVALID_MATERIAL, INVALID_COR, INVALID_ORDEM]
 *       409:
 *         description: SKU já existe ou ordem já está sendo usada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   enum: [SKU_EXISTS, ORDEM_EXISTS]
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, RecorteController.createRecorte);

/**
 * @swagger
 * /api/recortes:
 *   get:
 *     summary: Listar recortes com paginação e filtros
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, tipo ou SKU
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [ordem, nome, createdAt]
 *           default: ordem
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordem de classificação
 *       - in: query
 *         name: tipoRecorte
 *         schema:
 *           type: string
 *           enum: [frente, aba, lateral]
 *         description: Filtrar por tipo de recorte
 *       - in: query
 *         name: tipoProduto
 *         schema:
 *           type: string
 *           enum: [americano, trucker]
 *         description: Filtrar por tipo de produto
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           enum: [linho]
 *         description: Filtrar por material
 *       - in: query
 *         name: cor
 *         schema:
 *           type: string
 *           enum: [azul marinho, laranja]
 *         description: Filtrar por cor
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filtrar por status (true = ativo, false = inativo)
 *     responses:
 *       200:
 *         description: Lista de recortes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recorte'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, RecorteController.getRecortes);

/**
 * @swagger
 * /api/recortes/{id}:
 *   get:
 *     summary: Buscar recorte por ID
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do recorte (ObjectID de 24 caracteres)
 *     responses:
 *       200:
 *         description: Dados do recorte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Recorte'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: INVALID_ID_FORMAT
 *       404:
 *         description: Recorte não encontrado para o ID informado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: NOT_FOUND
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: GET_ERROR
 */
router.get('/:id', authenticateToken, RecorteController.getRecorteById);

/**
 * @swagger
 * /api/recortes/sku/{sku}:
 *   get:
 *     summary: Buscar recorte por SKU (independente do status)
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU do recorte
 *     responses:
 *       200:
 *         description: Recorte encontrado para o SKU informado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Recorte'
 *       400:
 *         description: SKU é obrigatório
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: SKU_REQUIRED
 *       404:
 *         description: Recorte não encontrado para o SKU informado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: NOT_FOUND
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: GET_ERROR
 */
router.get('/sku/:sku', authenticateToken, RecorteController.getRecorteBySku);

/**
 * @swagger
 * /api/recortes/{id}:
 *   put:
 *     summary: Atualizar recorte
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do recorte (ObjectID de 24 caracteres)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecorteUpdate'
 *     responses:
 *       200:
 *         description: Recorte atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recorte'
 *       400:
 *         description: ID inválido ou dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   enum: [INVALID_ID_FORMAT, INVALID_ORDEM]
 *       404:
 *         description: Recorte não encontrado
 *       409:
 *         description: SKU já existe ou ordem já está sendo usada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   enum: [SKU_EXISTS, ORDEM_EXISTS]
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', authenticateToken, RecorteController.updateRecorte);

/**
 * @swagger
 * /api/recortes/{id}/image:
 *   put:
 *     summary: Atualizar imagem do recorte
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do recorte
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recorte'
 *       404:
 *         description: Recorte não encontrado
 *       400:
 *         description: Nenhuma imagem enviada
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.put(
    '/:id/image',
    authenticateToken,
    upload.single('image'),
    handleUploadError,
    RecorteController.updateRecorteImage,
);

/**
 * @swagger
 * /api/recortes/{id}:
 *   delete:
 *     summary: Excluir recorte
 *     tags: [Recortes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do recorte
 *     responses:
 *       200:
 *         description: Recorte excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Recorte não encontrado
 *       401:
 *         description: Token necessário
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, RecorteController.deleteRecorte);

export default router;
