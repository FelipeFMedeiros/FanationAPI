import multer from 'multer';
import { Request } from 'express';

// Configuração do multer para armazenamento em memória
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
};

// Configuração do multer
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1, // Apenas 1 arquivo por vez
    },
});

// Middleware de tratamento de erros do multer
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Arquivo muito grande. Tamanho máximo: 5MB',
                error: 'FILE_TOO_LARGE',
            });
        }

        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Muitos arquivos. Envie apenas 1 arquivo por vez',
                error: 'TOO_MANY_FILES',
            });
        }

        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de arquivo inesperado',
                error: 'UNEXPECTED_FILE',
            });
        }
    }

    if (error.message === 'Apenas arquivos de imagem são permitidos!') {
        return res.status(400).json({
            success: false,
            message: 'Apenas arquivos de imagem são permitidos',
            error: 'INVALID_FILE_TYPE',
        });
    }

    next(error);
};
