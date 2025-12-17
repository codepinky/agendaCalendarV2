# 🪟 Backend Local no Windows

Scripts e configurações para rodar o backend localmente no Windows enquanto aguarda a VM da Oracle.

## 📋 Pré-requisitos

1. **Node.js** (LTS) - https://nodejs.org/
2. **Git** (opcional) - https://git-scm.com/download/win
3. **Docker Desktop** (para N8N) - https://www.docker.com/products/docker-desktop

## 🚀 Início Rápido

### 1. Instalar Dependências

Execute:
```powershell
.\scripts\local-windows\instalar-dependencias.bat
```

Ou manualmente:
```powershell
cd backend
npm install
npm run build
```

### 2. Configurar .env

1. Copie `backend/.env.example` para `backend/.env`
2. Edite `backend/.env` com suas credenciais
3. Para desenvolvimento local, use:
   - `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback`
   - `CORS_ORIGIN=http://localhost:5173`
   - `N8N_WEBHOOK_URL=http://localhost:5678/webhook/agendamento`

### 3. Iniciar Backend

Execute:
```powershell
.\scripts\local-windows\iniciar-backend.bat
```

Ou manualmente:
```powershell
cd backend
npm start
```

Backend estará em: `http://localhost:3000`

### 4. Iniciar N8N (Opcional)

Execute:
```powershell
.\scripts\local-windows\iniciar-n8n.bat
```

Ou manualmente:
```powershell
cd %USERPROFILE%\Projetos\n8n
docker-compose up -d
```

N8N estará em: `http://localhost:5678`

## 📝 Scripts Disponíveis

- **`instalar-dependencias.bat`** - Instala todas as dependências
- **`iniciar-backend.bat`** - Inicia o backend
- **`iniciar-n8n.bat`** - Inicia o N8N em Docker

## 🔧 Configuração do Frontend

No `frontend/.env`, certifique-se de que está:

```env
VITE_API_URL=http://localhost:3000/api
```

## ✅ Verificar se Está Funcionando

### Backend:
```powershell
curl http://localhost:3000/health
```

Ou acesse: `http://localhost:3000/health`

### N8N:
Acesse: `http://localhost:5678`
- Usuário: `admin`
- Senha: `changeme` (mude depois!)

## 🔄 Migrar para VM Oracle (Quando Liberar)

Quando conseguir criar a VM:

1. **Atualizar `.env` do backend** com IP da VM
2. **Executar deploy:**
   ```bash
   cd infrastructure
   bash deploy.sh
   ```

## 📚 Documentação Completa

Veja `INSTALAR_WINDOWS.md` para instruções detalhadas.

