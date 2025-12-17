# Scripts de Deploy e Provisionamento

Scripts profissionais para provisionar a VM Oracle e fazer deploy da aplicação.

## 📋 Estrutura

```
scripts/
├── provision/
│   └── setup-vm.sh          # Provisionamento inicial da VM
└── deploy/
    ├── setup-n8n.sh         # Configurar e iniciar N8N em Docker
    ├── deploy-backend.sh    # Deploy do backend na VM
    ├── deploy-frontend.sh   # Deploy do frontend no Firebase
    └── update-env-production.sh  # Atualizar variáveis de ambiente
```

## 🚀 Fluxo de Deploy Completo

### 1. Provisionamento Inicial da VM

**Na sua máquina local:**
```bash
# Copiar script para VM
scp scripts/provision/setup-vm.sh user@vm-ip:/tmp/

# Conectar na VM e executar
ssh user@vm-ip
sudo bash /tmp/setup-vm.sh
```

**O que faz:**
- Atualiza o sistema
- Instala Docker e Docker Compose
- Instala Node.js 20.x
- Instala PM2 (process manager)
- Instala Nginx (opcional)
- Cria estrutura de diretórios

### 2. Configurar N8N

**Na VM:**
```bash
# Copiar script para VM
scp scripts/deploy/setup-n8n.sh user@vm-ip:/tmp/

# Executar na VM
ssh user@vm-ip
bash /tmp/setup-n8n.sh
```

**O que faz:**
- Cria estrutura de diretórios para N8N
- Cria docker-compose.yml
- Cria arquivo .env (ATUALIZE A SENHA!)
- Inicia N8N em Docker

**Após executar:**
1. Acesse N8N: `http://vm-ip:5678`
2. Configure seus workflows
3. Anote a URL do webhook
4. Atualize `N8N_WEBHOOK_URL` no `.env` do backend

### 3. Deploy do Backend

**Na sua máquina local:**
```bash
bash scripts/deploy/deploy-backend.sh user@vm-ip
```

**O que faz:**
- Compila o TypeScript
- Envia arquivos para VM
- Instala dependências
- Configura systemd service
- Inicia o serviço

### 4. Atualizar Variáveis de Ambiente em Produção

**Na sua máquina local:**
```bash
bash scripts/deploy/update-env-production.sh user@vm-ip
```

**O que faz:**
- Solicita URL da VM e N8N
- Atualiza `.env` com URLs de produção
- Reinicia o serviço

**Importante:**
- Atualize o `GOOGLE_REDIRECT_URI` no Google Cloud Console
- Adicione: `https://sua-vm.com/api/google-calendar/callback`

### 5. Deploy do Frontend

**Na sua máquina local:**
```bash
bash scripts/deploy/deploy-frontend.sh
```

**O que faz:**
- Instala Firebase CLI (se necessário)
- Faz login no Firebase
- Build do projeto
- Deploy no Firebase Hosting

**Após deploy:**
- Atualize `VITE_API_URL` no `.env` do frontend para URL da VM
- Faça novo build e deploy

## 🔧 Comandos Úteis

### Backend (na VM)

```bash
# Ver logs
sudo journalctl -u agenda-calendar-backend -f

# Reiniciar serviço
sudo systemctl restart agenda-calendar-backend

# Status do serviço
sudo systemctl status agenda-calendar-backend

# Parar serviço
sudo systemctl stop agenda-calendar-backend
```

### N8N (na VM)

```bash
cd /opt/agenda-calendar/n8n

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Iniciar
docker-compose up -d
```

### Frontend

```bash
cd frontend

# Build local
npm run build

# Deploy
firebase deploy --only hosting

# Ver histórico de deploys
firebase hosting:channel:list
```

## 🔒 Segurança

1. **Firewall:**
   - Abra apenas portas necessárias (3000, 5678)
   - Use Nginx como reverse proxy (recomendado)

2. **N8N:**
   - Altere a senha padrão no `.env`
   - Configure autenticação básica

3. **Backend:**
   - Mantenha `.env` seguro
   - Use HTTPS em produção
   - Configure rate limiting

## 📝 Checklist de Deploy

- [ ] VM provisionada
- [ ] N8N configurado e rodando
- [ ] Backend deployado e rodando
- [ ] Frontend deployado no Firebase
- [ ] Variáveis de ambiente atualizadas
- [ ] Google OAuth redirect URI configurado
- [ ] Firewall configurado
- [ ] Testes realizados

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Ver logs detalhados
sudo journalctl -u agenda-calendar-backend -n 50

# Verificar se porta está em uso
sudo netstat -tulpn | grep 3000
```

### N8N não acessível
```bash
# Verificar se container está rodando
docker ps | grep n8n

# Ver logs
cd /opt/agenda-calendar/n8n
docker-compose logs
```

### Erro de permissões
```bash
# Ajustar permissões
sudo chown -R $USER:$USER /opt/agenda-calendar
```

