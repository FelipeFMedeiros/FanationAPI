import { v2 as cloudinary } from 'cloudinary';

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Função para validar configuração do Cloudinary
export const validateCloudinaryConfig = (): void => {
    const errors: string[] = [];

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        errors.push('CLOUDINARY_CLOUD_NAME is required');
    }

    if (!process.env.CLOUDINARY_API_KEY) {
        errors.push('CLOUDINARY_API_KEY is required');
    }

    if (!process.env.CLOUDINARY_API_SECRET) {
        errors.push('CLOUDINARY_API_SECRET is required');
    }

    if (errors.length > 0) {
        console.warn('⚠️  Cloudinary configuration warnings:');
        errors.forEach((error) => console.warn(`   - ${error}`));
        console.warn('   Upload de imagens não funcionará sem essas configurações\n');
    } else {
        console.log('✅ Cloudinary configurado corretamente\n');
    }
};
