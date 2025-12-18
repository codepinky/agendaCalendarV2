#!/bin/bash

# Script completo de deploy: Terraform + Ansible para AWS
# Execute como: bash deploy-aws.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform-aws"
ANSIBLE_DIR="$SCRIPT_DIR/ansible"

echo "🚀 Iniciando deploy completo da infraestrutura na AWS..."

# Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform não encontrado. Instale: https://www.terraform.io/downloads"
    exit 1
fi

if ! command -v ansible &> /dev/null; then
    echo "❌ Ansible não encontrado. Instale: pip3 install ansible"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI não encontrado. Instale: https://aws.amazon.com/cli/"
    echo "   Ou configure credenciais via variáveis de ambiente"
fi

# Verificar arquivos de configuração
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo "❌ Arquivo terraform.tfvars não encontrado!"
    echo "   Copie terraform.tfvars.example e configure:"
    echo "   cd $TERRAFORM_DIR"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    echo "   nano terraform.tfvars"
    exit 1
fi

if [ ! -f "$ANSIBLE_DIR/inventory.ini" ]; then
    echo "⚠️  Arquivo inventory.ini não encontrado. Será criado após Terraform."
fi

# Verificar credenciais AWS
echo "🔐 Verificando credenciais AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "⚠️  AWS CLI não configurado ou credenciais não encontradas"
    echo "   Configure com: aws configure"
    echo "   Ou defina variáveis: AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Passo 1: Terraform
echo ""
echo "🏗️  Passo 1: Criando VM com Terraform..."
cd "$TERRAFORM_DIR"

if [ ! -d ".terraform" ]; then
    echo "   Inicializando Terraform..."
    terraform init
fi

echo "   Validando configuração..."
terraform validate

echo "   Criando recursos..."
terraform apply -auto-approve

# Obter IP da VM
VM_IP=$(terraform output -raw instance_public_ip)
VM_DNS=$(terraform output -raw instance_public_dns)
echo "   ✅ VM criada! IP: $VM_IP"
echo "   ✅ DNS: $VM_DNS"

# Passo 2: Configurar Ansible
echo ""
echo "⚙️  Passo 2: Configurando Ansible..."

cd "$ANSIBLE_DIR"

# Criar inventory se não existir
if [ ! -f "inventory.ini" ]; then
    echo "   Criando inventory.ini..."
    cat > inventory.ini << EOF
[agenda_calendar]
$VM_IP ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/id_rsa

[agenda_calendar:vars]
ansible_python_interpreter=/usr/bin/python3
EOF
    echo "   ✅ inventory.ini criado. ATUALIZE a chave SSH se necessário!"
fi

# Atualizar variáveis com IP da VM
echo "   Atualizando variáveis com IP da VM..."
if [ -f "group_vars/all.yml" ]; then
    sed -i.bak "s/VM_IP/$VM_IP/g" group_vars/all.yml
    sed -i.bak "s/VM_DNS/$VM_DNS/g" group_vars/all.yml
    rm -f group_vars/all.yml.bak
fi

# Passo 3: Ansible
echo ""
echo "📦 Passo 3: Provisionando VM com Ansible..."

# Aguardar VM estar pronta
echo "   Aguardando VM estar pronta (60 segundos)..."
sleep 60

# Testar conexão
echo "   Testando conexão SSH..."
ansible agenda_calendar -m ping || {
    echo "   ⚠️  Conexão falhou. Aguardando mais 30 segundos..."
    sleep 30
    ansible agenda_calendar -m ping || {
        echo "   ❌ Não foi possível conectar. Verifique:"
        echo "      - SSH key está correta?"
        echo "      - Security Group permite SSH?"
        echo "      - VM está rodando?"
        exit 1
    }
}

# Executar playbook
echo "   Executando playbook..."
ansible-playbook playbook.yml

echo ""
echo "✅ Deploy completo!"
echo ""
echo "📋 Informações:"
echo "   - VM IP: $VM_IP"
echo "   - VM DNS: $VM_DNS"
echo "   - Backend: http://$VM_IP:3000/health"
echo "   - N8N: http://$VM_IP:5678"
echo ""
echo "🔐 Não esqueça de:"
echo "   1. Alterar senha do N8N em group_vars/all.yml"
echo "   2. Atualizar GOOGLE_REDIRECT_URI no Google Cloud Console"
echo "   3. Configurar workflows no N8N"
echo ""
echo "💰 Lembrete: Esta instância usa recursos do AWS Free Tier"
echo "   - t2.micro: 750 horas/mês por 12 meses"
echo "   - 30 GB de armazenamento EBS"


