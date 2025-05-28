import { Request, Response } from 'express';
import { prisma } from '../config/database';
import cloudinary from '../config/cloudinary';
import {
    RecorteData,
    CreateRecorteDTO,
    UpdateRecorteDTO,
    RecorteQuery,
    PaginatedRecortes,
    CloudinaryUploadResult,
} from '../types/recorte';

export class RecorteController {
    // Upload de imagem para Cloudinary
    static async uploadImage(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Nenhuma imagem foi enviada',
                    error: 'NO_FILE',
                });
                return;
            }

            const { tipoProduto, tipoRecorte, material, cor } = req.body;

            // Validar campos obrigatórios
            if (!tipoProduto || !tipoRecorte || !material || !cor) {
                res.status(400).json({
                    success: false,
                    message: 'Campos obrigatórios: tipoProduto, tipoRecorte, material, cor',
                    error: 'MISSING_FIELDS',
                });
                return;
            }

            // Gerar nome do arquivo baseado no padrão especificado
            // Converter espaços e caracteres especiais
            const fileName = `${tipoProduto.replace(/\s+/g, '-')}_${tipoRecorte}_${material}_${cor.replace(
                /\s+/g,
                '-',
            )}`;

            // Upload para Cloudinary
            const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: 'recortes',
                            public_id: fileName,
                            resource_type: 'image',
                            transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result as CloudinaryUploadResult);
                        },
                    )
                    .end(req.file?.buffer);
            });

            res.status(200).json({
                success: true,
                message: 'Imagem enviada com sucesso',
                data: {
                    imageUrl: result.secure_url,
                    publicId: result.public_id,
                    fileName: fileName,
                },
            });
        } catch (error: any) {
            console.error('❌ Erro no upload:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'UPLOAD_ERROR',
            });
        }
    }

    // Criar recorte
    static async createRecorte(req: Request, res: Response): Promise<void> {
        try {
            const data: CreateRecorteDTO = req.body;

            // Validações obrigatórias
            const requiredFields: (keyof CreateRecorteDTO)[] = [
                'nome',
                'ordem',
                'sku',
                'tipoRecorte',
                'posicao',
                'tipoProduto',
                'material',
                'cor',
            ];
            const missingFields = requiredFields.filter((field) => !data[field]);

            if (missingFields.length > 0) {
                res.status(400).json({
                    success: false,
                    message: `Campos obrigatórios não informados: ${missingFields.join(', ')}`,
                    error: 'MISSING_REQUIRED_FIELDS',
                    missingFields,
                });
                return;
            }

            // Validar se SKU foi fornecido (validação adicional)
            if (!data.sku || data.sku.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'SKU é obrigatório e não pode estar vazio',
                    error: 'SKU_REQUIRED',
                });
                return;
            }

            // Validar se imagem foi fornecida
            if (!data.urlImagem || data.urlImagem.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'URL da imagem é obrigatória. Faça upload da imagem primeiro usando o endpoint /upload',
                    error: 'IMAGE_REQUIRED',
                });
                return;
            }

            // Validar valores dos enums
            const validTipoRecorte = ['frente', 'aba', 'lateral'];
            const validPosicao = ['frente', 'traseira'];
            const validTipoProduto = ['americano', 'trucker'];
            const validMaterial = ['linho'];
            const validCor = ['azul marinho', 'laranja'];

            if (!validTipoRecorte.includes(data.tipoRecorte)) {
                res.status(400).json({
                    success: false,
                    message: `Tipo de recorte inválido. Valores aceitos: ${validTipoRecorte.join(', ')}`,
                    error: 'INVALID_TIPO_RECORTE',
                });
                return;
            }

            if (!validPosicao.includes(data.posicao)) {
                res.status(400).json({
                    success: false,
                    message: `Posição inválida. Valores aceitos: ${validPosicao.join(', ')}`,
                    error: 'INVALID_POSICAO',
                });
                return;
            }

            if (!validTipoProduto.includes(data.tipoProduto)) {
                res.status(400).json({
                    success: false,
                    message: `Tipo de produto inválido. Valores aceitos: ${validTipoProduto.join(', ')}`,
                    error: 'INVALID_TIPO_PRODUTO',
                });
                return;
            }

            if (!validMaterial.includes(data.material)) {
                res.status(400).json({
                    success: false,
                    message: `Material inválido. Valores aceitos: ${validMaterial.join(', ')}`,
                    error: 'INVALID_MATERIAL',
                });
                return;
            }

            if (!validCor.includes(data.cor)) {
                res.status(400).json({
                    success: false,
                    message: `Cor inválida. Valores aceitos: ${validCor.join(', ')}`,
                    error: 'INVALID_COR',
                });
                return;
            }

            // Validar se ordem é um número positivo
            if (!Number.isInteger(data.ordem) || data.ordem < 1) {
                res.status(400).json({
                    success: false,
                    message: 'Ordem deve ser um número inteiro positivo',
                    error: 'INVALID_ORDEM',
                });
                return;
            }

            // Validar se SKU já existe
            const existingRecorte = await prisma.recorte.findUnique({
                where: { sku: data.sku },
            });

            if (existingRecorte) {
                res.status(409).json({
                    success: false,
                    message: 'SKU já existe',
                    error: 'SKU_EXISTS',
                    existingSku: data.sku,
                });
                return;
            }

            // Criar recorte com status padrão ativo (true)
            const recorte = await prisma.recorte.create({
                data: {
                    nome: data.nome,
                    ordem: data.ordem,
                    sku: data.sku,
                    tipoRecorte: data.tipoRecorte,
                    posicao: data.posicao,
                    tipoProduto: data.tipoProduto,
                    material: data.material,
                    cor: data.cor,
                    urlImagem: data.urlImagem,
                    status: data.status !== undefined ? data.status : true, // Padrão: ativo (true)
                } as any, // Temporary fix até o schema ser atualizado
            });

            res.status(201).json({
                success: true,
                message: 'Recorte criado com sucesso',
                data: recorte,
            });
        } catch (error: any) {
            console.error('❌ Erro ao criar recorte:', error);

            // Tratar erros específicos do Prisma
            if (error.code === 'P2002') {
                res.status(409).json({
                    success: false,
                    message: 'Violação de restrição única no banco de dados',
                    error: 'UNIQUE_CONSTRAINT_ERROR',
                    field: error.meta?.target,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'CREATE_ERROR',
            });
        }
    }

    // Listar recortes com paginação e filtros
    static async getRecortes(req: Request, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'ordem',
                sortOrder = 'asc',
                tipoRecorte,
                tipoProduto,
                material,
                cor,
                status, // Filtro de status
            }: RecorteQuery = req.query;

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            // Construir filtros
            const where: any = {};

            if (search) {
                where.OR = [
                    { nome: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                    { tipoRecorte: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (tipoRecorte) where.tipoRecorte = tipoRecorte;
            if (tipoProduto) where.tipoProduto = tipoProduto;
            if (material) where.material = material;
            if (cor) where.cor = cor;

            // Filtro de status - corrigir comparação
            if (status !== undefined) {
                if (typeof status === 'string') {
                    where.status = status === 'true';
                } else {
                    where.status = Boolean(status);
                }
            }

            // Executar consultas em paralelo
            const [recortes, total] = await Promise.all([
                prisma.recorte.findMany({
                    where,
                    skip,
                    take,
                    orderBy: { [sortBy]: sortOrder },
                }),
                prisma.recorte.count({ where }),
            ]);

            const totalPages = Math.ceil(total / take);

            // Mapear dados para incluir status (temporary fix)
            const mappedRecortes: RecorteData[] = recortes.map((recorte: any) => ({
                ...recorte,
                status: recorte.status !== undefined ? recorte.status : true, // Fallback para true
            }));

            const result: PaginatedRecortes = {
                success: true,
                data: mappedRecortes,
                pagination: {
                    page: Number(page),
                    limit: take,
                    total,
                    totalPages,
                    hasNext: Number(page) < totalPages,
                    hasPrev: Number(page) > 1,
                },
            };

            res.status(200).json(result);
        } catch (error: any) {
            console.error('❌ Erro ao listar recortes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'LIST_ERROR',
            });
        }
    }

    // Buscar recorte por ID
    static async getRecorteById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar se o ID tem o formato correto de ObjectID
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido. Deve ser um ObjectID válido (24 caracteres hexadecimais)',
                    error: 'INVALID_ID_FORMAT',
                });
                return;
            }

            // Buscar recorte único pelo ID
            const recorte = await prisma.recorte.findUnique({
                where: { id },
            });

            if (!recorte) {
                res.status(404).json({
                    success: false,
                    message: 'Recorte não encontrado para o ID informado',
                    error: 'NOT_FOUND',
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: recorte,
            });
        } catch (error: any) {
            console.error('❌ Erro ao buscar recorte:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'GET_ERROR',
            });
        }
    }

    // Buscar recorte por SKU
    static async getRecorteBySku(req: Request, res: Response): Promise<void> {
        try {
            const { sku } = req.params;

            if (!sku || sku.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: 'SKU é obrigatório',
                    error: 'SKU_REQUIRED',
                });
                return;
            }

            // Buscar recorte único pelo SKU
            const recorte = await prisma.recorte.findUnique({
                where: { sku },
            });

            if (!recorte) {
                res.status(404).json({
                    success: false,
                    message: 'Recorte não encontrado para o SKU informado',
                    error: 'NOT_FOUND',
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: recorte,
            });
        } catch (error: any) {
            console.error('❌ Erro ao buscar recorte:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'GET_ERROR',
            });
        }
    }

    // Atualizar recorte
    static async updateRecorte(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const data: UpdateRecorteDTO = req.body;

            // Validar se o ID tem o formato correto de ObjectID
            if (!id.match(/^[0-9a-fA-F]{24}$/)) {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido. Deve ser um ObjectID válido (24 caracteres hexadecimais)',
                    error: 'INVALID_ID_FORMAT',
                });
                return;
            }

            // Verificar se recorte existe
            const existingRecorte = await prisma.recorte.findUnique({
                where: { id },
            });

            if (!existingRecorte) {
                res.status(404).json({
                    success: false,
                    message: 'Recorte não encontrado',
                    error: 'NOT_FOUND',
                });
                return;
            }

            // Validações para campos que estão sendo atualizados
            if (data.sku && data.sku !== existingRecorte.sku) {
                const existingSku = await prisma.recorte.findUnique({
                    where: { sku: data.sku },
                });

                if (existingSku) {
                    res.status(409).json({
                        success: false,
                        message: 'SKU já está sendo usado por outro recorte',
                        error: 'SKU_EXISTS',
                        existingSku: data.sku,
                    });
                    return;
                }
            }

            // Validar ordem se estiver sendo atualizada
            if (data.ordem && data.ordem !== existingRecorte.ordem) {
                if (!Number.isInteger(data.ordem) || data.ordem < 1) {
                    res.status(400).json({
                        success: false,
                        message: 'Ordem deve ser um número inteiro positivo',
                        error: 'INVALID_ORDEM',
                    });
                    return;
                }

                const tipoProdutoToCheck = data.tipoProduto || existingRecorte.tipoProduto;
                const existingOrdem = await prisma.recorte.findFirst({
                    where: {
                        tipoProduto: tipoProdutoToCheck,
                        ordem: data.ordem,
                        id: { not: id }, // Excluir o próprio recorte
                    },
                });

                if (existingOrdem) {
                    res.status(409).json({
                        success: false,
                        message: `Ordem ${data.ordem} já está sendo usada para o tipo de produto "${tipoProdutoToCheck}"`,
                        error: 'ORDEM_EXISTS',
                        conflictingOrder: data.ordem,
                        conflictingProduct: tipoProdutoToCheck,
                    });
                    return;
                }
            }

            // Atualizar recorte
            const updatedRecorte = await prisma.recorte.update({
                where: { id },
                data: data as any, // Temporary fix até o schema ser atualizado
            });

            res.status(200).json({
                success: true,
                message: 'Recorte atualizado com sucesso',
                data: updatedRecorte,
            });
        } catch (error: any) {
            console.error('❌ Erro ao atualizar recorte:', error);

            // Tratar erros específicos do Prisma
            if (error.code === 'P2002') {
                res.status(409).json({
                    success: false,
                    message: 'Violação de restrição única no banco de dados',
                    error: 'UNIQUE_CONSTRAINT_ERROR',
                    field: error.meta?.target,
                });
                return;
            }

            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'UPDATE_ERROR',
            });
        }
    }

    // Atualizar imagem do recorte
    static async updateRecorteImage(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'Nenhuma imagem foi enviada',
                    error: 'NO_FILE',
                });
                return;
            }

            // Verificar se recorte existe
            const existingRecorte = await prisma.recorte.findUnique({
                where: { id },
            });

            if (!existingRecorte) {
                res.status(404).json({
                    success: false,
                    message: 'Recorte não encontrado',
                    error: 'NOT_FOUND',
                });
                return;
            }

            // Excluir imagem anterior do Cloudinary se existir
            if (existingRecorte.urlImagem) {
                try {
                    // Extrair public_id da URL
                    const urlParts = existingRecorte.urlImagem.split('/');
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `recortes/${publicIdWithExt.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.warn('⚠️ Erro ao excluir imagem anterior do Cloudinary:', cloudinaryError);
                }
            }

            // Gerar nome do arquivo baseado nos dados do recorte
            const fileName = `${existingRecorte.tipoProduto.replace(/\s+/g, '-')}_${existingRecorte.tipoRecorte}_${
                existingRecorte.material
            }_${existingRecorte.cor.replace(/\s+/g, '-')}`;

            // Upload nova imagem
            const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: 'recortes',
                            public_id: fileName,
                            resource_type: 'image',
                            transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result as CloudinaryUploadResult);
                        },
                    )
                    .end(req.file?.buffer);
            });

            // Atualizar recorte com nova imagem
            const updatedRecorte = await prisma.recorte.update({
                where: { id },
                data: {
                    urlImagem: result.secure_url,
                },
            });

            res.status(200).json({
                success: true,
                message: 'Imagem atualizada com sucesso',
                data: updatedRecorte,
            });
        } catch (error: any) {
            console.error('❌ Erro ao atualizar imagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'UPDATE_IMAGE_ERROR',
            });
        }
    }

    // Excluir recorte
    static async deleteRecorte(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Verificar se recorte existe
            const existingRecorte = await prisma.recorte.findUnique({
                where: { id },
            });

            if (!existingRecorte) {
                res.status(404).json({
                    success: false,
                    message: 'Recorte não encontrado',
                    error: 'NOT_FOUND',
                });
                return;
            }

            // Excluir imagem do Cloudinary se existir
            if (existingRecorte.urlImagem) {
                try {
                    // Extrair public_id da URL
                    const urlParts = existingRecorte.urlImagem.split('/');
                    const publicIdWithExt = urlParts[urlParts.length - 1];
                    const publicId = `recortes/${publicIdWithExt.split('.')[0]}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.warn('⚠️ Erro ao excluir imagem do Cloudinary:', cloudinaryError);
                }
            }

            // Excluir recorte do banco
            await prisma.recorte.delete({
                where: { id },
            });

            res.status(200).json({
                success: true,
                message: 'Recorte excluído com sucesso',
            });
        } catch (error: any) {
            console.error('❌ Erro ao excluir recorte:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: 'DELETE_ERROR',
            });
        }
    }
}
