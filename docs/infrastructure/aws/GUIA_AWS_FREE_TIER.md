# 🚀 Guia: Deploy na AWS Free Tier

Guia completo para fazer deploy da aplicação na AWS usando apenas recursos do Free Tier.

## 📋 O que está incluído no Free Tier

### ✅ Recursos que vamos usar (todos Free Tier):

1. **EC2 t2.micro**
   - 750 horas/mês por 12 meses
   - 1 vCPU, 1 GB RAM
   - Perfeito para nossa aplicação

2. **EBS Storage (gp3)**
   - 30 GB de armazenamento
   - Incluído no Free Tier

3. **VPC (Virtual Private Cloud)**
   - Uso da VPC padrão: **GRÁTIS**
   - Internet Gateway: **GRÁTIS**
   - Security Groups: **GRÁTIS**

4. **Data Transfer**
   - 15 GB de saída/mês (primeiro ano)
   - 1 GB de entrada/mês

## 📝 Pré-requisitos

### 1. Conta AWS

1. **Criar conta AWS:**
   - Acesse: https://aws.amazon.com
   - Clique em "Create an AWS Account"
   - Siga o processo de cadastro
   - **Importante:** Use cartão de crédito (não será cobrado se usar apenas Free Tier)

2. **Verificar Free Tier:**
   - Após criar a conta, você tem 12 meses de Free Tier
   - Acesse: AWS Console > Billing > Free Tier

### 2. Instalar Ferramentas

**Terraform:**
```bash
# macOS
brew install terraform

# Verificar
terraform --version
```

**Ansible:**
```bash
# macOS
brew install ansible

# Ou via pip
pip3 install ansible

# Verificar
ansible --version
```

**AWS CLI (Opcional, mas recomendado):**
```bash
# macOS
brew install awscli

# Verificar
aws --version
```

### 3. Configurar Credenciais AWS

**Opção 1: AWS CLI (Recomendado)**
```bash
aws configure
```

Você precisará de:
- **AWS Access Key ID**: Criar em IAM > Users > Security credentials > Create access key
- **AWS Secret Access Key**: Mostrado apenas uma vez ao criar
- **Default region**: `us-east-1` (recomendado) ou `sa-east-1` (São Paulo)
- **Default output format**: `json`

**Opção 2: Variáveis de Ambiente**
```bash
export AWS_ACCESS_KEY_ID="sua-access-key"
export AWS_SECRET_ACCESS_KEY="sua-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

**Como obter Access Keys:**
1. Acesse: AWS Console > IAM > Users
2. Selecione seu usuário (ou crie um novo)
3. Aba "Security credentials"
4. "Create access key"
5. Escolha "Command Line Interface (CLI)"
6. Baixe ou copie as credenciais

### 4. Chave SSH

Se ainda não tiver:
```bash
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "agendacalendar@aws"

# Ver chave pública
cat ~/.ssh/id_rsa.pub
```

## 🚀 Deploy Rápido

### Passo 1: Configurar Terraform

```bash
cd infrastructure/terraform-aws

# Copiar template
cp terraform.tfvars.example terraform.tfvars

# Editar com suas informações
nano terraform.tfvars
```

**Preencher `terraform.tfvars`:**
```hcl
aws_region = "us-east-1"  # ou "sa-east-1" para São Paulo

ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@machine"

ansible_user = "ec2-user"
```

### Passo 2: Executar Deploy Automatizado

```bash
cd infrastructure
bash deploy-aws.sh
```

Este script faz tudo automaticamente:
1. ✅ Cria VPC, Security Groups
2. ✅ Cria instância EC2 t2.micro
3. ✅ Configura Ansible
4. ✅ Provisiona tudo (Docker, Node.js, N8N, Backend)

## 🔧 Deploy Manual (Passo a Passo)

### Passo 1: Terraform

```bash
cd infrastructure/terraform-aws

# Inicializar
terraform init

# Validar
terraform validate

# Ver plano
terraform plan

# Criar recursos
terraform apply
```

### Passo 2: Obter IP da VM

```bash
terraform output instance_public_ip
```

### Passo 3: Configurar Ansible

```bash
cd ../ansible

# Criar inventory
cat > inventory.ini << EOF
[agenda_calendar]
SEU_IP_AQUI ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/id_rsa

[agenda_calendar:vars]
ansible_python_interpreter=/usr/bin/python3
EOF

# Atualizar variáveis
nano group_vars/all.yml
# Atualizar: n8n_host, google_redirect_uri, etc.
```

### Passo 4: Provisionar com Ansible

```bash
# Testar conexão
ansible agenda_calendar -m ping

# Executar playbook
ansible-playbook playbook.yml
```

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

## 💰 Custos e Free Tier

### O que está incluído (12 meses):

- ✅ **EC2 t2.micro**: 750 horas/mês
- ✅ **EBS Storage**: 30 GB gp3
- ✅ **Data Transfer**: 15 GB saída, 1 GB entrada/mês
- ✅ **VPC**: Grátis (sempre)

### Limites importantes:

- ⚠️ **750 horas/mês** = ~31 dias contínuos
- ⚠️ Se usar mais de 750 horas, será cobrado
- ⚠️ Após 12 meses, recursos saem do Free Tier

### Monitorar uso:

```bash
# Via AWS CLI
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]' --output table

# Via Console
# AWS Console > EC2 > Instances
```

## 🔒 Segurança

1. **Security Groups:**
   - Apenas portas necessárias estão abertas
   - SSH (22), HTTP (80), HTTPS (443), Backend (3000), N8N (5678)

2. **Chaves SSH:**
   - Use chaves SSH, não senhas
   - Mantenha chave privada segura

3. **IAM:**
   - Use usuário IAM com permissões mínimas
   - Não use credenciais root

## 🆘 Troubleshooting

### Erro: "No credentials found"

```bash
# Configurar AWS CLI
aws configure

# Ou definir variáveis
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### Erro: "Instance limit exceeded"

- Você pode ter atingido o limite de instâncias
- Verifique: AWS Console > EC2 > Limits
- Free Tier permite múltiplas instâncias, mas limite total de 5 por região

### Erro: "Insufficient capacity"

- t2.micro pode não estar disponível na região
- Tente outra região (us-east-1 geralmente tem mais disponibilidade)

### Não consigo conectar via SSH

```bash
# Verificar se instância está rodando
aws ec2 describe-instances --instance-ids i-xxxxx

# Verificar security group
aws ec2 describe-security-groups --group-names agenda-calendar-sg

# Testar conexão
ssh -i ~/.ssh/id_rsa ec2-user@VM_IP
```

## 📚 Recursos Adicionais

- [AWS Free Tier](https://aws.amazon.com/free/)
- [EC2 Free Tier](https://aws.amazon.com/ec2/pricing/free-tier/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible AWS Guide](https://docs.ansible.com/ansible/latest/scenario_guides/guide_aws.html)

## ✅ Checklist

- [ ] Conta AWS criada
- [ ] AWS CLI configurado ou variáveis de ambiente definidas
- [ ] Terraform instalado
- [ ] Ansible instalado
- [ ] Chave SSH criada
- [ ] `terraform.tfvars` configurado
- [ ] VM criada com Terraform
- [ ] Ansible inventory configurado
- [ ] Playbook executado com sucesso
- [ ] Backend acessível
- [ ] N8N acessível
- [ ] Senhas alteradas
- [ ] Google OAuth configurado
