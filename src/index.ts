import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import environment variables
import { HOST, PORT, NODE_ENV, validateSettings } from './config/settings';
import { validateCloudinaryConfig } from './config/cloudinary';

// Import routes
import authRoutes from './routes/authRoutes';
import usersRoutes from './routes/usersRoutes';
import recorteRoutes from './routes/recorteRoutes';

// Import controllers
import { AuthController } from './controllers/authController';

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fanation API',
            version: '1.0.0',
            description: 'API para sistema de gestão de recortes',
            contact: {
                name: 'Suporte',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${HOST}:${PORT}`,
                description: `${NODE_ENV} environment`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'], // caminho para os arquivos com comentários JSDoc
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();

// Trust proxy (importante para obter IP real em produção)
app.set('trust proxy', 1);

// Rate limiting global
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Máximo 1000 requests por IP por janela
    message: {
        success: false,
        message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        error: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req: Request, res: Response, next) => {
    console.log(`📨 ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Routes
console.log('🛣️  Registrando rotas...');
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/recortes', recorteRoutes);
console.log('✅ Todas as rotas registradas');

// Status check route
app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'API está funcionando!',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Default route
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Fanation API - Sistema de Gestão de Recortes',
        version: '1.0.0',
        endpoints: {
            status: '/status',
            auth: '/api/auth',
            users: '/api/users',
            recortes: '/api/recortes',
            documentation: '/api-docs',
        },
    });
});

// Error handler (deve vir antes do 404 handler)
app.use((error: any, req: Request, res: Response, next: any) => {
    console.error('❌ Erro não tratado:', error);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR',
    });
});

// 404 handler - DEVE SER O ÚLTIMO MIDDLEWARE
app.use((req: Request, res: Response) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Endpoint não encontrado',
        error: 'NOT_FOUND',
        path: req.url,
        method: req.method,
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Validar configurações
        validateSettings();

        // Validar configuração do Cloudinary
        validateCloudinaryConfig();

        // Inicializar admin padrão
        console.log('\n👤 Inicializando usuário admin...');
        await AuthController.initializeAdmin();

        // Para Vercel, não precisamos chamar listen
        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`\n✅ Server running at http://${HOST}:${PORT}`);
                console.log(`🌍 Environment: ${NODE_ENV}`);
                console.log(`📊 Status check: http://${HOST}:${PORT}/status`);
                console.log(`📜 Swagger UI: http://${HOST}:${PORT}/api-docs`);
            });
        }
    } catch (error) {
        console.error('\n❌ Erro ao iniciar servidor:', error);
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

// Inicializar para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
    startServer();
}

// Exportar para Vercel
export default app;
