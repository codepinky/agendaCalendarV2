# Configuração Completa - Sistema de Upload de Imagens e Biolink

## 📋 Checklist de Configuração

### 1. Variáveis de Ambiente Necessárias no `.env`

O arquivo `/opt/agenda-calendar/backend/.env` na VM precisa ter as seguintes variáveis:

```bash
# ============================================
# FIREBASE (OBRIGATÓRIO - Para Storage e Firestore)
# ============================================
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com

# ============================================
# GOOGLE CALENDAR (Opcional - se usar integração)
# ============================================
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_REDIRECT_URI=https://agendacalendar.duckdns.org/api/google-calendar/callback

# ============================================
# SERVIDOR
# ============================================
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://agendacalendar-cae1a.web.app

# ============================================
# N8N (Opcional - se usar webhooks)
# ============================================
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/path
WEBHOOK_BRIDGE_SECRET=seu-secret-aqui
```

### 2. Dependências do Backend

Todas as dependências necessárias já estão no `package.json`:
- ✅ `multer` - Para upload de arquivos
- ✅ `uuid` - Para gerar tokens únicos
- ✅ `firebase-admin` - Para Firebase Storage e Firestore

### 3. Rotas de Upload Configuradas

As seguintes rotas estão implementadas e funcionais:

#### Backend (`/api/users/upload/...`)
- ✅ `POST /api/users/upload/profile-image` - Upload de foto de perfil
- ✅ `POST /api/users/upload/banner-image` - Upload de banner
- ✅ `POST /api/users/upload/background-image` - Upload de imagem de fundo

#### Frontend (`frontend/src/services/api.ts`)
- ✅ `uploadProfileImage(file)` - Chama `/users/upload/profile-image`
- ✅ `uploadBannerImage(file)` - Chama `/users/upload/banner-image`
- ✅ `uploadBackgroundImage(file)` - Chama `/users/upload/background-image`

### 4. Firebase Storage

#### Configuração Necessária:
1. **Firebase Console**: Verificar se o Storage está habilitado
2. **Regras de Segurança**: Configurar regras para permitir uploads autenticados
3. **Bucket**: O bucket padrão será usado automaticamente (`{project-id}.appspot.com`)

#### Estrutura de Armazenamento:
```
users/
  {userId}/
    profile/
      {timestamp}.{ext}
    banner/
      {timestamp}.{ext}
    background/
      {timestamp}.{ext}
```

### 5. Nginx Configurado

O nginx está configurado para:
- ✅ Aceitar uploads até 10MB (`client_max_body_size 10M`)
- ✅ Proxy reverso para o backend na porta 3000
- ✅ SSL/HTTPS configurado com Let's Encrypt
- ✅ Redirecionamento HTTP → HTTPS

### 6. Componentes Frontend

#### Componentes Implementados:
- ✅ `ImageUpload` - Componente reutilizável para upload
- ✅ `PublicCustomization` - Formulário de customização
- ✅ `PublicSchedule` - Página pública com layout biolink

#### Funcionalidades do Biolink:
- ✅ Banner no topo
- ✅ Foto de perfil circular
- ✅ Imagem de fundo
- ✅ Descrição/Bio
- ✅ @ Principal
- ✅ Redes sociais com ícones
- ✅ @ por rede social

## 🔧 Como Configurar

### Passo 1: Configurar Firebase Storage

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto: `agendacalendar-cae1a`
3. Vá em **Storage** → **Get Started**
4. Configure as regras de segurança (veja `REGRAS_FIREBASE_STORAGE.md` para detalhes):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Regras para imagens de perfil público
    match /users/{userId}/{allPaths=**} {
      // Permitir leitura pública (qualquer um pode ler com token na URL)
      // As URLs são geradas com token de download, então são seguras
      allow read: if true;
      
      // Escrita e deleção apenas via Service Account (backend)
      // O backend usa service account, então essas operações são feitas server-side
      allow write: if false; // Bloqueado - apenas service account pode escrever
      allow delete: if false; // Bloqueado - apenas service account pode deletar
    }
  }
}
```

**Importante**: 
- As imagens são acessadas via URL com token (`?token=...`)
- O backend usa Service Account para upload/deleção (não precisa das regras)
- A leitura pública é necessária para exibir imagens na página pública

### Passo 2: Obter Credenciais do Firebase

1. Firebase Console → **Project Settings** → **Service Accounts**
2. Clique em **Generate New Private Key**
3. Baixe o arquivo JSON
4. Extraia:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (manter formato com `\n`)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Passo 3: Configurar .env na VM

**Opção A: Via SSH (Recomendado)**
```bash
ssh ec2-user@54.207.236.103
sudo nano /opt/agenda-calendar/backend/.env
# Cole as variáveis corretas
sudo systemctl restart agenda-calendar-backend
```

**Opção B: Via Ansible (Após atualizar group_vars/all.yml)**
```bash
# Edite infrastructure/ansible/group_vars/all.yml com valores reais
cd infrastructure/ansible
ansible-playbook playbook.app.yml --tags backend
```

### Passo 4: Verificar se Está Funcionando

```bash
# Verificar se o backend está rodando
curl https://agendacalendar.duckdns.org/api/health

# Verificar logs do backend
ssh ec2-user@54.207.236.103
sudo journalctl -u agenda-calendar-backend -f
```

## ✅ Validação Final

Após configurar, verifique:

- [ ] Backend inicia sem erros (`systemctl status agenda-calendar-backend`)
- [ ] Health check responde (`/api/health`)
- [ ] Rotas de upload retornam 401 (não autenticado) ao invés de 404
- [ ] Firebase Storage está acessível
- [ ] Frontend consegue fazer upload de imagens
- [ ] Imagens aparecem na página pública

## 🐛 Troubleshooting

### Backend não inicia
- Verificar logs: `journalctl -u agenda-calendar-backend -n 50`
- Verificar formato da chave privada (deve ter `\n` literal)
- Verificar se todas as variáveis estão preenchidas

### Erro 404 nas rotas de upload
- Verificar se o backend foi deployado com as novas rotas
- Verificar se o nginx está fazendo proxy corretamente
- Verificar logs do nginx: `sudo tail -f /var/log/nginx/error.log`

### Upload falha
- Verificar tamanho do arquivo (máx 10MB)
- Verificar tipo do arquivo (JPG, PNG, WEBP)
- Verificar permissões do Firebase Storage
- Verificar se o usuário está autenticado

## 📝 Notas Importantes

1. **Chave Privada do Firebase**: Deve estar entre aspas e com `\n` literal para quebras de linha
2. **Bucket do Storage**: Usa o bucket padrão do projeto automaticamente
3. **URLs das Imagens**: São permanentes e incluem token de acesso
4. **Backup**: O Ansible agora faz backup do `.env` antes de sobrescrever

