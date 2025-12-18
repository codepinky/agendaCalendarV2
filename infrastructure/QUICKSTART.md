# Quick Start - Deploy Completo

Guia rápido para fazer deploy completo da aplicação na Oracle Cloud.

## ⚡ Deploy Automatizado (Recomendado)

```bash
cd infrastructure
bash deploy.sh
```

Este script faz tudo automaticamente:
1. Cria a VM com Terraform
2. Configura Ansible
3. Provisiona tudo (Docker, Node.js, N8N, Backend)

## 📝 Pré-requisitos

1. **Instalar ferramentas:**
   ```bash
   # Terraform
   brew install terraform  # macOS
   # ou baixe de: https://www.terraform.io/downloads
   
   # Ansible
   pip3 install ansible
   ```

2. **Obter credenciais OCI:**
   - Acesse: https://cloud.oracle.com
   - Crie API Key (Identity > Users > API Keys)
   - Baixe a chave privada (.pem)
   - Anote: tenancy_ocid, user_ocid, fingerprint, compartment_id

3. **Configurar Terraform:**
   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   nano terraform.tfvars  # Preencher com suas credenciais
   ```

4. **Ter chave SSH:**
   ```bash
   # Se não tiver, criar:
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   
   # Adicionar chave pública ao terraform.tfvars
   cat ~/.ssh/id_rsa.pub
   ```

## 🚀 Executar

```bash
cd infrastructure
bash deploy.sh
```

## ⏱️ Tempo Estimado

- Terraform (criar VM): ~5-10 minutos
- Ansible (provisionar): ~10-15 minutos
- **Total: ~15-25 minutos**

## ✅ Após o Deploy

1. **Acessar N8N:**
   - URL: `http://VM_IP:5678`
   - Usuário: `admin`
   - Senha: (verifique em `ansible/group_vars/all.yml`)

2. **Verificar Backend:**
   ```bash
   curl http://VM_IP:3000/health
   ```

3. **Configurar Google OAuth:**
   - Google Cloud Console > Credentials
   - Adicionar redirect URI: `https://VM_IP/api/google-calendar/callback`

4. **Deploy do Frontend:**
   ```bash
   cd scripts/deploy
   bash deploy-frontend.sh
   ```

## 🔧 Deploy Manual (Passo a Passo)

Se preferir fazer manualmente, veja `README.md` completo.



