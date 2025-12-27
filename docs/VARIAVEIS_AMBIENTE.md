# 🔧 Variáveis de Ambiente - Backend

Este documento descreve todas as variáveis de ambiente necessárias para configurar o backend do Agenda Calendar.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Variáveis Obrigatórias](#variáveis-obrigatórias)
3. [Variáveis Opcionais](#variáveis-opcionais)
4. [Como Obter os Valores](#como-obter-os-valores)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuração Inicial

### Passo 1: Copiar arquivo de exemplo

```bash
cd backend
cp .env.example .env
```

### Passo 2: Preencher valores

Edite o arquivo `.env` e preencha os valores conforme suas configurações.

### Passo 3: Verificar

Certifique-se de que o arquivo `.env` está no `.gitignore` (já está configurado).

---

## ✅ Variáveis Obrigatórias

### 🔥 Firebase (Sempre Necessário)

#### `FIREBASE_PROJECT_ID`
- **Descrição**: ID do projeto Firebase
- **Onde encontrar**: 
  1. Acesse [Firebase Console](https://console.firebase.google.com)
  2. Selecione seu projeto
  3. Vá em **Project Settings** > **General**
  4. Copie o **Project ID**
- **Exemplo**: `agendacalendar-cae1a`
- **Formato**: String sem espaços

#### `FIREBASE_PRIVATE_KEY`
- **Descrição**: Chave privada do Service Account do Firebase
- **Onde encontrar**:
  1. Firebase Console > **Project Settings** > **Service Accounts**
  2. Clique em **Generate new private key**
  3. Baixe o arquivo JSON
  4. Copie o valor do campo `private_key`
- **Exemplo**: 
  ```
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
  ```
- **⚠️ IMPORTANTE**: 
  - Mantenha as quebras de linha (`\n`)
  - Use aspas duplas no arquivo `.env`
  - NUNCA commite esta chave no Git

#### `FIREBASE_CLIENT_EMAIL`
- **Descrição**: Email do Service Account do Firebase
- **Onde encontrar**: 
  1. Mesmo arquivo JSON do `FIREBASE_PRIVATE_KEY`
  2. Copie o valor do campo `client_email`
- **Exemplo**: `firebase-adminsdk-xxxxx@agendacalendar-cae1a.iam.gserviceaccount.com`
- **Formato**: Email válido

---

## 🔐 Variáveis Opcionais (mas Recomendadas)

### 🌐 Configurações Gerais

#### `PORT`
- **Descrição**: Porta onde o servidor Express irá rodar
- **Padrão**: `3000`
- **Exemplo**: `3000` ou `8080`
- **Quando mudar**: Se a porta 3000 já estiver em uso

#### `NODE_ENV`
- **Descrição**: Ambiente de execução
- **Valores possíveis**: 
  - `development` - Modo desenvolvimento (logs detalhados)
  - `production` - Modo produção (logs otimizados)
- **Padrão**: `development`
- **Recomendação**: Use `production` em produção

#### `CORS_ORIGIN`
- **Descrição**: URL do frontend para CORS e redirecionamentos
- **Padrão**: `http://localhost:5173` (desenvolvimento)
- **Exemplo produção**: `https://agendacalendar-cae1a.web.app`
- **Exemplo desenvolvimento**: `http://localhost:5173`
- **⚠️ IMPORTANTE**: Deve corresponder exatamente à URL do frontend

#### `API_URL`
- **Descrição**: URL base da API (usado na documentação Swagger)
- **Padrão**: `http://localhost:3000`
- **Exemplo produção**: `https://agendacalendar.duckdns.org`
- **Opcional**: Se não configurado, Swagger usa `http://localhost:3000`

---

### 📅 Google Calendar (Opcional)

**Nota**: Essas variáveis são necessárias apenas se você quiser integração com Google Calendar. Se não configurar, a funcionalidade ficará desabilitada.

#### `GOOGLE_CLIENT_ID`
- **Descrição**: Client ID do OAuth 2.0 do Google
- **Onde encontrar**:
  1. Acesse [Google Cloud Console](https://console.cloud.google.com)
  2. Selecione seu projeto
  3. Vá em **APIs & Services** > **Credentials**
  4. Crie ou selecione credenciais OAuth 2.0
  5. Copie o **Client ID**
- **Exemplo**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Formato**: String com `.apps.googleusercontent.com`

#### `GOOGLE_CLIENT_SECRET`
- **Descrição**: Client Secret do OAuth 2.0 do Google
- **Onde encontrar**: 
  1. Mesmo lugar do `GOOGLE_CLIENT_ID`
  2. Copie o **Client Secret**
- **Exemplo**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
- **⚠️ IMPORTANTE**: Mantenha secreto, não commite no Git

#### `GOOGLE_REDIRECT_URI`
- **Descrição**: URI de redirecionamento do OAuth
- **Formato**: `{URL_DO_BACKEND}/api/google-calendar/callback`
- **Exemplo produção**: `https://agendacalendar.duckdns.org/api/google-calendar/callback`
- **Exemplo desenvolvimento**: `http://localhost:3000/api/google-calendar/callback`
- **⚠️ IMPORTANTE**: 
  - Deve estar configurado no Google Cloud Console
  - Deve corresponder exatamente à URL do backend

**Como configurar no Google Cloud Console:**
1. Vá em **APIs & Services** > **Credentials**
2. Clique nas credenciais OAuth 2.0
3. Em **Authorized redirect URIs**, adicione:
   - `https://agendacalendar.duckdns.org/api/google-calendar/callback` (produção)
   - `http://localhost:3000/api/google-calendar/callback` (desenvolvimento)

---

### 🔗 Webhooks

#### `WEBHOOK_BRIDGE_SECRET` (Obrigatório para webhooks)
- **Descrição**: Secret compartilhado entre n8n e backend
- **Uso**: Autentica webhooks do n8n antes de processar
- **Requisitos**:
  - Mínimo 32 caracteres
  - String aleatória segura
  - Deve ser o mesmo valor configurado no n8n
- **Como gerar**:
  ```bash
  # Opção 1: Usando OpenSSL
  openssl rand -hex 32
  
  # Opção 2: Usando Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Exemplo**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
- **⚠️ IMPORTANTE**: 
  - Deve ser o mesmo no n8n e no backend
  - Mantenha secreto, não commite no Git

#### `KIWIFY_WEBHOOK_SECRET` (Opcional)
- **Descrição**: Secret do webhook da Kiwify para validação HMAC SHA256
- **Onde encontrar**: 
  1. Painel Kiwify > **Configurações** > **Webhooks**
  2. Copie o **Webhook Secret**
- **Uso**: Valida assinatura dos webhooks da Kiwify
- **Opcional**: Se não configurar, a validação será ignorada (com aviso no log)
- **Recomendação**: Configure em produção para maior segurança
- **Exemplo**: `kiwify_webhook_secret_123456789`

---

## 📖 Como Obter os Valores

### Firebase

1. **Acesse Firebase Console**: https://console.firebase.google.com
2. **Selecione seu projeto**
3. **Project Settings** > **Service Accounts**
4. **Generate new private key**
5. Baixe o JSON e extraia:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Google Calendar

1. **Acesse Google Cloud Console**: https://console.cloud.google.com
2. **Selecione seu projeto**
3. **APIs & Services** > **Credentials**
4. **Create Credentials** > **OAuth client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: Adicione a URL do callback
6. Copie:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

### Webhooks

1. **WEBHOOK_BRIDGE_SECRET**: Gere uma string aleatória (veja seção acima)
2. **KIWIFY_WEBHOOK_SECRET**: Painel Kiwify > Configurações > Webhooks

---

## 🔍 Troubleshooting

### Erro: "FIREBASE_PROJECT_ID is not defined"
- **Causa**: Variável não configurada
- **Solução**: Adicione `FIREBASE_PROJECT_ID=seu-projeto-id` no `.env`

### Erro: "Invalid Firebase credentials"
- **Causa**: `FIREBASE_PRIVATE_KEY` ou `FIREBASE_CLIENT_EMAIL` incorretos
- **Solução**: 
  1. Verifique se copiou corretamente do JSON
  2. Certifique-se de manter as quebras de linha (`\n`)
  3. Use aspas duplas no arquivo `.env`

### Erro: "CORS policy blocked"
- **Causa**: `CORS_ORIGIN` não corresponde à URL do frontend
- **Solução**: 
  1. Verifique a URL exata do frontend
  2. Atualize `CORS_ORIGIN` no `.env`
  3. Reinicie o servidor

### Erro: "Google Calendar not connected"
- **Causa**: Variáveis do Google Calendar não configuradas
- **Solução**: 
  1. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`
  2. Certifique-se de que o redirect URI está autorizado no Google Cloud Console

### Erro: "Invalid x-webhook-secret"
- **Causa**: `WEBHOOK_BRIDGE_SECRET` diferente no n8n e no backend
- **Solução**: 
  1. Verifique o valor no n8n
  2. Certifique-se de que é o mesmo no backend `.env`
  3. Reinicie ambos os serviços

### Swagger não mostra URL correta
- **Causa**: `API_URL` não configurado
- **Solução**: Configure `API_URL=https://agendacalendar.duckdns.org` no `.env`

---

## 📝 Exemplo Completo de .env

```env
# Configurações Gerais
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://agendacalendar-cae1a.web.app
API_URL=https://agendacalendar.duckdns.org

# Firebase (Obrigatório)
FIREBASE_PROJECT_ID=agendacalendar-cae1a
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@agendacalendar-cae1a.iam.gserviceaccount.com

# Google Calendar (Opcional)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://agendacalendar.duckdns.org/api/google-calendar/callback

# Webhooks
WEBHOOK_BRIDGE_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
KIWIFY_WEBHOOK_SECRET=kiwify_webhook_secret_123456789
```

---

## ✅ Checklist de Configuração

Antes de iniciar o servidor, verifique:

- [ ] Arquivo `.env` criado (copiado de `.env.example`)
- [ ] `FIREBASE_PROJECT_ID` configurado
- [ ] `FIREBASE_PRIVATE_KEY` configurado (com quebras de linha)
- [ ] `FIREBASE_CLIENT_EMAIL` configurado
- [ ] `CORS_ORIGIN` corresponde à URL do frontend
- [ ] `WEBHOOK_BRIDGE_SECRET` configurado (se usar webhooks)
- [ ] `WEBHOOK_BRIDGE_SECRET` é o mesmo no n8n (se usar n8n)
- [ ] Variáveis do Google Calendar configuradas (se usar Google Calendar)
- [ ] `GOOGLE_REDIRECT_URI` autorizado no Google Cloud Console
- [ ] Arquivo `.env` está no `.gitignore` (já configurado)

---

## 🔒 Segurança

### ⚠️ NUNCA faça:
- ❌ Commitar o arquivo `.env` no Git
- ❌ Compartilhar variáveis de ambiente publicamente
- ❌ Usar valores de exemplo em produção
- ❌ Expor `FIREBASE_PRIVATE_KEY` ou `GOOGLE_CLIENT_SECRET`

### ✅ SEMPRE faça:
- ✅ Mantenha o `.env` no `.gitignore`
- ✅ Use valores seguros e aleatórios para secrets
- ✅ Rotacione secrets periodicamente
- ✅ Use diferentes valores para desenvolvimento e produção

---

## 📚 Referências

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Kiwify Webhooks Documentation](https://help.kiwify.com.br/pt-BR/articles/webhooks)

---

**Última atualização**: 19/12/2025









