# ✅ Tudo Pronto para Deploy!

## Status das Credenciais

- ✅ Tenancy OCID configurado
- ✅ User OCID configurado
- ✅ Compartment OCID configurado
- ✅ API Key Fingerprint configurado
- ✅ Chave privada API Key: `~/.oci/oci_api_key.pem`
- ✅ Região: `sa-saopaulo-1` (Brazil East)
- ✅ Chave SSH pública configurada

## 🚀 Próximo Passo: Deploy

Você tem duas opções:

### Opção 1: Deploy Automatizado (Recomendado)

```bash
cd infrastructure
bash deploy.sh
```

Este script faz tudo automaticamente:
1. Cria a VM com Terraform
2. Configura Ansible
3. Provisiona tudo (Docker, Node.js, N8N, Backend)

**Tempo estimado:** 15-25 minutos

### Opção 2: Deploy Manual (Passo a Passo)

#### Passo 1: Criar a VM

```bash
cd infrastructure/terraform

# Inicializar Terraform
terraform init

# Ver o que será criado (opcional)
terraform plan

# Criar a VM
terraform apply
```

Quando perguntar, digite `yes` para confirmar.

**Aguarde:** A VM será criada (~5-10 minutos)

#### Passo 2: Provisionar com Ansible

Após a VM ser criada, você verá o IP público. Então:

```bash
cd ../ansible

# Copiar template de inventory
cp inventory.ini.example inventory.ini

# Editar inventory.ini com o IP da VM
nano inventory.ini
```

No `inventory.ini`, adicione:
```ini
[agenda_calendar]
SEU_IP_AQUI ansible_user=opc ansible_ssh_private_key_file=~/.ssh/id_rsa
```

Depois, atualize as variáveis com o IP da VM:

```bash
# Editar group_vars/all.yml
nano group_vars/all.yml
```

Atualize:
- `google_redirect_uri`: `https://SEU_IP/api/google-calendar/callback`
- `n8n_host`: `SEU_IP`
- `n8n_webhook_url`: `http://SEU_IP:5678/webhook/agendamento`

Então execute:

```bash
# Testar conexão
ansible agenda_calendar -m ping

# Executar playbook
ansible-playbook playbook.yml
```

## 📋 O que será criado

1. **VM Oracle Cloud:**
   - Shape: VM.Standard.A1.Flex (Always Free)
   - 1 OCPU, 6 GB RAM
   - IP público

2. **Software instalado:**
   - Docker + Docker Compose
   - Node.js 20.x + PM2
   - N8N (em Docker, porta 5678)
   - Backend da aplicação (porta 3000)

3. **Serviços configurados:**
   - Backend como systemd service
   - N8N rodando em Docker
   - Firewall configurado

## ✅ Após o Deploy

1. **Verificar Backend:**
   ```bash
   curl http://SEU_IP:3000/health
   ```

2. **Acessar N8N:**
   - URL: `http://SEU_IP:5678`
   - Usuário: `admin`
   - Senha: (verifique em `ansible/group_vars/all.yml`)

3. **Configurar Google OAuth:**
   - Google Cloud Console > Credentials
   - Adicionar redirect URI: `https://SEU_IP/api/google-calendar/callback`

4. **Deploy do Frontend:**
   ```bash
   cd scripts/deploy
   bash deploy-frontend.sh
   ```

## 🆘 Troubleshooting

### Erro ao conectar com Terraform
- Verifique se a chave privada está em `~/.oci/oci_api_key.pem`
- Verifique permissões: `chmod 600 ~/.oci/oci_api_key.pem`
- Verifique se o fingerprint está correto

### Erro ao conectar com Ansible
- Verifique se a chave SSH está correta
- Verifique se o IP da VM está correto
- Aguarde alguns minutos após criar a VM (pode demorar para ficar acessível)

### Backend não inicia
- Verifique logs: `ssh opc@SEU_IP 'sudo journalctl -u agenda-calendar-backend -f'`
- Verifique se o arquivo `.env` foi criado corretamente

## 📝 Comandos Úteis

```bash
# Ver IP da VM (após criar)
cd infrastructure/terraform
terraform output instance_public_ip

# Conectar na VM
ssh opc@SEU_IP

# Ver logs do backend
ssh opc@SEU_IP 'sudo journalctl -u agenda-calendar-backend -f'

# Reiniciar backend
ssh opc@SEU_IP 'sudo systemctl restart agenda-calendar-backend'

# Ver status do N8N
ssh opc@SEU_IP 'cd /opt/agenda-calendar/n8n && docker-compose ps'
```

## 🎯 Pronto!

Tudo configurado. Execute o deploy quando estiver pronto!

