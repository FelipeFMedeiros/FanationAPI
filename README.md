# 🎨 FanationAPI

> API RESTful para Sistema de Gestão de Recortes em Camadas 

[![Node Version][node-version-shield]][node-url] [![Express Version][express-version-shield]][express-url] [![TypeScript Version][typescript-version-shield]][typescript-url] [![Prisma Version][prisma-version-shield]][prisma-url]

## 📋 Sobre o Projeto

FanationAPI é uma API RESTful desenvolvida para gerenciar recortes de produtos, permitindo o controle de imagens em camadas que, quando combinadas, formam uma única imagem final. A API oferece:

- 🔐 Autenticação segura com JWT
- 👤 Gerenciamento de usuários com diferentes níveis de acesso
- 📦 CRUD completo para recortes de produtos
- 📸 Upload e gerenciamento de imagens via Cloudinary
- 📄 Documentação completa com Swagger

## 🔧 Requisitos

- Node.js v18 ou superior
- MongoDB (local ou Atlas)
- Conta no Cloudinary para armazenamento de imagens

## 🚀 Instalação

Clone o repositório e instale as dependências:

```bash
# Clone o repositório
git clone https://github.com/FelipeFMedeiros/FanationAPI.git
cd FanationAPI

# Instale as dependências
npm install
```

## ⚙️ Configuração de Ambiente

Antes de rodar o projeto, copie o arquivo de exemplo de variáveis de ambiente para criar seu próprio arquivo [`.env`](.env ):

```bash
cp .env.example .env
```

### Variáveis de Ambiente Necessárias

O arquivo [`.env.example`](.env.example ) contém todas as variáveis necessárias para o funcionamento do projeto:

```bash
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/FanationDB?retryWrites=true&w=majority&appName=FanationDB"

# JWT Configuration
JWT_SECRET=<your-super-secret-jwt-key-here>
JWT_EXPIRES_IN=7d

# Admin Password
ADMIN_NAME=Administrador
ADMIN_PASSWORD=<your-admin-password-here>

# Rate Limiting (for brute force protection)
LOGIN_ATTEMPTS_LIMIT=5
LOGIN_BLOCK_TIME=900000

# Configurações Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=seu_api_secret_aqui
```

Edite o arquivo [`.env`](.env ) com suas próprias configurações:

- **Configurações do Servidor**: Defina porta, host e ambiente
- **Banco de Dados**: Configure sua conexão MongoDB (local ou Atlas)
- **JWT**: Defina uma chave secreta forte para segurança dos tokens
- **Admin**: Configure nome e senha do administrador inicial
- **Rate Limiting**: Configure proteção contra força bruta
- **Cloudinary**: Configure suas credenciais para upload de imagens

## 🔄 Sincronização com o Banco de Dados

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Sincronizar schema com o banco de dados
npm run prisma:push

# (Opcional) Explorar o banco de dados via Prisma Studio
npm run prisma:studio
```

## 💻 Uso

```bash
# Ambiente de desenvolvimento
npm run dev

# Compilar para JavaScript
npm run build

# Executar versão compilada
npm run serve
```

Por padrão, o servidor estará disponível em:

- 🌐 http://localhost:3000
- 📚 Documentação Swagger: http://localhost:3000/api-docs
- 🔍 Status da API: http://localhost:3000/status

## 🌐 Endpoints da API

### Autenticação

- `POST /api/auth/login` - Fazer login
- `GET /api/auth/validate` - Validar token JWT

### Usuários

- `POST /api/users` - Criar novo usuário
- `GET /api/users` - Listar todos os usuários
- `PUT /api/users/update` - Atualizar usuário
- `DELETE /api/users/delete` - Excluir usuário

### Recortes

- `POST /api/recortes/upload` - Fazer upload de imagem
- `POST /api/recortes` - Criar novo recorte
- `GET /api/recortes` - Listar recortes (com paginação e filtros)
- `GET /api/recortes/{id}` - Buscar recorte por ID
- `GET /api/recortes/sku/{sku}` - Buscar recorte por SKU
- `PUT /api/recortes/{id}` - Atualizar recorte
- `PUT /api/recortes/{id}/image` - Atualizar imagem do recorte
- `DELETE /api/recortes/{id}` - Excluir recorte

## 📁 Estrutura do Projeto

```
FanationAPI/
├── 📦 node_modules/            # Dependências do projeto
├── 📂 prisma/                  # Configuração do Prisma ORM
│   └── schema.prisma           # Schema do banco de dados
├── 📂 src/
│   ├── ⚙️ config/              # Configurações da aplicação
│   │   ├── cloudinary.ts       # Configuração do Cloudinary
│   │   ├── database.ts         # Configuração do Prisma
│   │   └── settings.ts         # Configurações e variáveis de ambiente
│   ├── 🎮 controllers/         # Controladores da aplicação
│   │   ├── authController.ts   # Controlador de autenticação
│   │   ├── recorteController.ts# Controlador de recortes
│   │   └── usersController.ts  # Controlador de usuários
│   ├── 🔒 middleware/          # Middlewares
│   │   ├── auth.ts             # Middleware de autenticação
│   │   ├── bruteForce.ts       # Proteção contra força bruta
│   │   └── upload.ts           # Middleware de upload de arquivos
│   ├── 🛣️ routes/              # Rotas da API
│   │   ├── authRoutes.ts       # Rotas de autenticação
│   │   ├── recorteRoutes.ts    # Rotas de recortes
│   │   └── usersRoutes.ts      # Rotas de usuários
│   ├── 📝 types/               # Tipos TypeScript
│   │   ├── auth.ts             # Tipos para autenticação
│   │   ├── common.ts           # Tipos comuns
│   │   ├── recorte.ts          # Tipos para recortes
│   │   └── users.ts            # Tipos para usuários
│   └── 🚀 index.ts             # Ponto de entrada da aplicação
├── 📋 .env                     # Variáveis de ambiente (não versionado)
├── 📋 .env.example             # Exemplo de variáveis de ambiente
├── 📝 .gitignore               # Arquivos ignorados pelo Git
├── 📦 package.json             # Dependências e scripts
├── 📝 README.md                # Documentação do projeto
└── ⚙️ tsconfig.json            # Configuração do TypeScript
```

## 🔐 Autenticação

O sistema utiliza autenticação baseada em tokens JWT. Todos os endpoints (exceto login) requerem autenticação via token Bearer no cabeçalho:

```
Authorization: Bearer <seu-token-jwt>
```

Um usuário administrador é criado automaticamente no primeiro início do sistema, usando as credenciais definidas nas variáveis de ambiente [`ADMIN_NAME`](../../../../../../../c:/Users/Felipe/Documents/Codes/Repositories/FanationAPI/src/config/settings.ts ) e [`ADMIN_PASSWORD`](../../../../../../../c:/Users/Felipe/Documents/Codes/Repositories/FanationAPI/src/config/settings.ts ).

## 📊 Recursos Principais

- **Proteção contra Força Bruta**: Limite de tentativas de login
- **Validação de Dados**: Validações robustas para todas as entradas
- **Documentação Swagger**: API completamente documentada
- **Upload de Imagens**: Integração com Cloudinary
- **Paginação e Filtros**: Busca avançada de recortes
- **Tratamento de Erros**: Respostas de erro consistentes
- **Tipagem Forte**: TypeScript em todo o projeto

## 🛠️ Tecnologias Utilizadas

- **Backend**:
  - [Node.js](https://nodejs.org/) - Runtime JavaScript
  - [Express](https://expressjs.com/) - Framework web
  - [TypeScript](https://www.typescriptlang.org/) - Superset tipado de JavaScript
  - [Prisma](https://prisma.io/) - ORM para banco de dados
  - [MongoDB](https://www.mongodb.com/) - Banco de dados NoSQL

- **Autenticação & Segurança**:
  - [JWT](https://jwt.io/) - JSON Web Tokens
  - [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Criptografia de senhas
  - [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) - Proteção contra excesso de requisições

- **Upload & Armazenamento**:
  - [Cloudinary](https://cloudinary.com/) - Serviço de hospedagem de imagens
  - [Multer](https://www.npmjs.com/package/multer) - Middleware para upload de arquivos

- **Documentação**:
  - [Swagger UI Express](https://www.npmjs.com/package/swagger-ui-express)
  - [Swagger JSDoc](https://www.npmjs.com/package/swagger-jsdoc)

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Construir para produção
npm run build

# Executar versão de produção
npm run serve

# Gerenciar Prisma
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:push      # Sincronizar schema com banco
npm run prisma:studio    # Interface visual para o banco
```

## 🔍 Mais Informações

Para mais detalhes sobre como consumir esta API, consulte a documentação Swagger disponível em `/api-docs` após iniciar o servidor.

---

Desenvolvido por [Felipe Medeiros](https://github.com/FelipeFMedeiros)

<!-- MARKDOWN LINKS & IMAGES -->
[node-version-shield]: https://img.shields.io/badge/node-v18+-green.svg
[node-url]: https://nodejs.org/
[express-version-shield]: https://img.shields.io/badge/express-v5.1.0-blue.svg
[express-url]: https://expressjs.com/
[typescript-version-shield]: https://img.shields.io/badge/typescript-v5.8.3-blue.svg
[typescript-url]: https://www.typescriptlang.org/
[prisma-version-shield]: https://img.shields.io/badge/prisma-v5.22.0-orange.svg
[prisma-url]: https://www.prisma.io/
