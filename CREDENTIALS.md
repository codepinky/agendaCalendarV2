# Credenciais Necessárias

Este documento lista todas as credenciais necessárias para configurar a aplicação.

## 📋 Checklist de Credenciais

### ✅ Firebase (Firestore + Auth + Hosting)

**Onde obter:** Firebase Console (https://console.firebase.google.com)

1. **Credenciais do Frontend** (Firebase Console > Project Settings > General > Your apps):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

2. **Service Account do Backend** (Firebase Console > Project Settings > Service Accounts):
   - `FIREBASE_PROJECT_ID` (mesmo do frontend)
   - `FIREBASE_PRIVATE_KEY` (chave privada completa com `\n`)
   - `FIREBASE_CLIENT_EMAIL` (email da service account)

**Como obter a Service Account:**
1. Firebase Console > Project Settings > Service Accounts
2. Clique em "Generate new private key"
3. Baixe o arquivo JSON
4. Extraia: `project_id`, `private_key` e `client_email`

### ✅ Google Calendar API (OAuth 2.0)

**Onde obter:** Google Cloud Console (https://console.cloud.google.com)

1. **Criar Projeto no Google Cloud:**
   - Acesse Google Cloud Console
   - Crie um novo projeto ou selecione existente

2. **Habilitar Google Calendar API:**
   - APIs & Services > Library
   - Busque "Google Calendar API"
   - Clique em "Enable"

3. **Criar Credenciais OAuth 2.0:**
   - APIs & Services > Credentials
   - Clique em "Create Credentials" > "OAuth client ID"
   - Tipo: "Web application"
   - Nome: "Agenda Calendar App"
   - **Authorized redirect URIs:**
     - Desenvolvimento: `http://localhost:3000/api/google-calendar/callback`
     - Produção: `https://sua-vm-oracle.com/api/google-calendar/callback`
   - Copie o `Client ID` e `Client secret`

4. **Variáveis necessárias:**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (deve corresponder ao configurado acima)

### ✅ Backend (VM Oracle)

**Configurações do servidor:**
- `PORT`: Porta onde o backend rodará (padrão: 3000)
- `NODE_ENV`: `development` ou `production`
- `CORS_ORIGIN`: URL do frontend (Firebase Hosting em produção)

### ✅ N8N (Opcional)

**Webhook URL:**
- `N8N_WEBHOOK_URL`: URL do webhook do N8N que receberá os dados de agendamento
- Formato esperado: `https://seu-n8n.com/webhook/agendamento`

## 📝 Passo a Passo para Configurar

### 1. Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto ou selecione existente
3. Habilite:
   - **Authentication** > Sign-in method > Email/Password (habilitar)
   - **Firestore Database** > Create database (modo produção ou teste)
   - **Hosting** > Get started (para deploy do frontend)

4. **Para o Frontend:**
   - Project Settings > General
   - Role até "Your apps" > Web app (</>)
   - Copie as credenciais

5. **Para o Backend:**
   - Project Settings > Service Accounts
   - Generate new private key
   - Baixe o JSON e extraia as credenciais

### 2. Google Calendar API

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie/selecione projeto
3. Habilite Google Calendar API
4. Crie OAuth 2.0 credentials
5. Configure redirect URIs
6. Copie Client ID e Client Secret

### 3. Criar Arquivos .env

**Backend (`backend/.env`):**
```env
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@projeto.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/agendamento
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
```

## ⚠️ Importante

- **NUNCA** commite arquivos `.env` no Git
- Use `.env.example` como template
- Em produção, configure as variáveis diretamente na VM ou use um gerenciador de secrets
- O `FIREBASE_PRIVATE_KEY` deve manter os `\n` (quebras de linha) preservadas
- O `GOOGLE_REDIRECT_URI` deve corresponder EXATAMENTE ao configurado no Google Cloud Console

