export interface RecorteData {
    id: string;
    nome: string;
    ordem: number;
    sku: string;
    tipoRecorte: string;
    posicao: string;
    tipoProduto: string;
    material: string;
    cor: string;
    urlImagem: string;
    status: boolean; // true = ativo, false = inativo
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRecorteDTO {
    nome: string;
    ordem: number;
    sku: string;
    tipoRecorte: string;
    posicao: string;
    tipoProduto: string;
    material: string;
    cor: string;
    urlImagem?: string;
    status?: boolean; // true = ativo, false = inativo
}

export interface UpdateRecorteDTO {
    nome?: string;
    ordem?: number;
    sku?: string;
    tipoRecorte?: string;
    posicao?: string;
    tipoProduto?: string;
    material?: string;
    cor?: string;
    urlImagem?: string;
    status?: boolean; // true = ativo, false = inativo
}

export interface RecorteQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'ordem' | 'nome' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    tipoRecorte?: string;
    tipoProduto?: string;
    material?: string;
    cor?: string;
    status?: string | boolean; // Aceitar tanto string quanto boolean
}

export interface PaginatedRecortes {
    success: boolean;
    data: RecorteData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    original_filename: string;
    bytes: number;
    format: string;
}

// Tipos para os valores permitidos
export const TIPOS_RECORTE = ['frente', 'aba', 'lateral'] as const;
export const POSICOES = ['frente', 'traseira'] as const;
export const TIPOS_PRODUTO = ['boné americano', 'boné trucker'] as const;
export const MATERIAIS = ['linho'] as const;
export const CORES = ['azul marinho', 'laranja'] as const;

export type TipoRecorte = (typeof TIPOS_RECORTE)[number];
export type Posicao = (typeof POSICOES)[number];
export type TipoProduto = (typeof TIPOS_PRODUTO)[number];
export type Material = (typeof MATERIAIS)[number];
export type Cor = (typeof CORES)[number];
