# 🪟 Configuração do Backend no Windows

Guia completo para rodar o backend localmente no Windows enquanto aguarda a VM da Oracle.

## 📋 Pré-requisitos

### 1. Instalar Node.js

1. **Baixar Node.js:**
   - Acesse: https://nodejs.org/
   - Baixe a versão **LTS** (Long Term Support)
   - Instale o instalador `.msi`

2. **Verificar instalação:**
   ```powershell
   node --version
   npm --version
   ```

### 2. Instalar Git

1. **Baixar Git:**
   - Acesse: https://git-scm.com/download/win
   - Baixe e instale

2. **Verificar instalação:**
   ```powershell
   git --version
   ```

### 3. Instalar Docker Desktop (para N8N)

1. **Baixar Docker Desktop:**
   - Acesse: https://www.docker.com/products/docker-desktop
   - Baixe e instale Docker Desktop para Windows

2. **Verificar instalação:**
   ```powershell
   docker --version
   docker-compose --version
   ```

## 🚀 Configuração do Backend

### 1. Clonar/Copiar o Projeto

Se você já tem o projeto:
```powershell
# Navegar para onde quer o projeto
cd C:\Projetos
# Ou criar pasta
mkdir C:\Projetos
cd C:\Projetos
```

Se não tem, copie a pasta `backend` do projeto para o Windows.

### 2. Configurar Variáveis de Ambiente

1. **Criar arquivo `.env` na pasta `backend`:**
   ```powershell
   cd backend
   notepad .env
   ```

2. **Conteúdo do `.env` (exemplo, preencha com seus dados reais):**
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=SEU_FIREBASE_PROJECT_ID
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=SEU_FIREBASE_CLIENT_EMAIL

   # Google Calendar OAuth 2.0
   GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=SEU_GOOGLE_CLIENT_SECRET
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # N8N Webhook (local)
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/agendamento
   ```

3. **Salvar o arquivo**

### 3. Instalar Dependências

```powershell
cd backend
npm install
```

### 4. Build do Projeto

```powershell
npm run build
```

### 5. Iniciar o Backend

```powershell
npm start
```

Ou em modo desenvolvimento (com hot reload):
```powershell
npm run dev
```

O backend estará rodando em: `http://localhost:3000`

## 🐳 Configurar N8N (Opcional)

### 1. Criar Pasta para N8N

```powershell
mkdir C:\Projetos\n8n
cd C:\Projetos\n8n
```

### 2. Criar docker-compose.yml

```powershell
notepad docker-compose.yml
```

**Conteúdo:**
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
    volumes:
      - ./data:/home/node/.n8n
      - ./workflows:/workflows
```

### 3. Iniciar N8N

```powershell
docker-compose up -d
```

N8N estará disponível em: `http://localhost:5678`
- Usuário: `admin`
- Senha: `changeme` (mude depois!)

## 🔧 Configurar Frontend para Usar Backend Local

No arquivo `frontend/.env`, certifique-se de que está:

```env
VITE_API_URL=http://localhost:3000/api
```

## ✅ Verificar se Está Funcionando

### Backend:
```powershell
# Em outro terminal
curl http://localhost:3000/health
```

Ou acesse no navegador: `http://localhost:3000/health`

### N8N:
Acesse: `http://localhost:5678`

## 🚀 Scripts de Inicialização Rápida

Criei scripts `.bat` para facilitar. Veja a pasta `scripts/local-windows/`.

## 📝 Próximos Passos

1. ✅ Backend rodando localmente
2. ✅ Frontend apontando para `http://localhost:3000/api`
3. ✅ N8N rodando (opcional)
4. ⏳ Quando a VM Oracle liberar, migre usando os scripts de deploy

## 🔄 Migrar para VM Oracle (Quando Liberar)

Quando conseguir criar a VM:

1. **Atualizar `.env` do backend** com IP da VM
2. **Executar script de deploy:**
   ```bash
   cd infrastructure
   bash deploy.sh
   ```

Ou manualmente:
```bash
cd infrastructure/ansible
# Configurar inventory.ini com IP da VM
ansible-playbook playbook.yml
```

