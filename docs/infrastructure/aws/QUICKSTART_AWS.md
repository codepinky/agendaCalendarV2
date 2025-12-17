# ⚡ Quick Start - AWS Free Tier

Guia rápido para fazer deploy completo da aplicação na AWS usando Free Tier.

## 🚀 Deploy Automatizado (Recomendado)

```bash
cd infrastructure
bash deploy-aws.sh
```

Este script faz tudo automaticamente:
1. Cria a VM com Terraform (EC2 t2.micro)
2. Configura Ansible
3. Provisiona tudo (Docker, Node.js, N8N, Backend)

## 📝 Pré-requisitos Rápidos

### 1. Conta AWS
- Crie em: https://aws.amazon.com
- **Importante:** Use cartão de crédito (não será cobrado se usar apenas Free Tier)

### 2. Configurar Credenciais AWS

**Opção A: AWS CLI (Recomendado)**
```bash
# Instalar
brew install awscli

# Configurar
aws configure
```

Você precisará:
- **Access Key ID**: IAM > Users > Security credentials > Create access key
- **Secret Access Key**: Mostrado apenas uma vez
- **Region**: `us-east-1` (recomendado) ou `sa-east-1` (São Paulo)

**Opção B: Variáveis de Ambiente**
```bash
export AWS_ACCESS_KEY_ID="sua-key"
export AWS_SECRET_ACCESS_KEY="sua-secret"
export AWS_DEFAULT_REGION="us-east-1"
```

### 3. Instalar Ferramentas

```bash
# Terraform
brew install terraform

# Ansible
brew install ansible
# ou
pip3 install ansible
```

### 4. Chave SSH

```bash
# Se não tiver
ssh-keygen -t rsa -b 4096 -C "agendacalendar@aws"

# Ver chave pública
cat ~/.ssh/id_rsa.pub
```

## 🚀 Executar

### Passo 1: Configurar Terraform

```bash
cd infrastructure/terraform-aws
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

**Preencher:**
```hcl
aws_region = "us-east-1"  # ou "sa-east-1" para São Paulo

ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@machine"

ansible_user = "ec2-user"
```

### Passo 2: Executar Deploy

```bash
cd infrastructure
bash deploy-aws.sh
```

## ⏱️ Tempo Estimado

- Terraform (criar VM): ~3-5 minutos
- Ansible (provisionar): ~10-15 minutos
- **Total: ~15-20 minutos**

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
   - Adicionar redirect URI: `http://VM_IP/api/google-calendar/callback`

4. **Deploy do Frontend:**
   - Use Firebase Hosting (já configurado)
   - Ou configure Nginx para servir o frontend

## 💰 Free Tier - O que está incluído

- ✅ **EC2 t2.micro**: 750 horas/mês (12 meses)
- ✅ **EBS Storage**: 30 GB gp3
- ✅ **Data Transfer**: 15 GB saída/mês
- ✅ **VPC**: Grátis (sempre)

## 🔧 Deploy Manual

Se preferir fazer manualmente:

```bash
# 1. Terraform
cd infrastructure/terraform-aws
terraform init
terraform plan
terraform apply

# 2. Obter IP
terraform output instance_public_ip

# 3. Configurar Ansible
cd ../ansible
# Criar inventory.ini com o IP

# 4. Provisionar
ansible-playbook playbook.yml
```

## 🆘 Problemas Comuns

**"No credentials found"**
```bash
aws configure
# ou
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

**"Insufficient capacity"**
- Tente outra região (us-east-1 geralmente tem mais disponibilidade)

**Não consigo conectar via SSH**
```bash
# Verificar security group
# Verificar se instância está rodando
aws ec2 describe-instances
```

## 📚 Documentação Completa

Veja `GUIA_AWS_FREE_TIER.md` para instruções detalhadas.
