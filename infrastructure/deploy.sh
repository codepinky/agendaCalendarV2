#!/bin/bash

# Script completo de deploy: Terraform + Ansible
# Execute como: bash deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
ANSIBLE_DIR="$SCRIPT_DIR/ansible"

echo "🚀 Iniciando deploy completo da infraestrutura..."

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

# Verificar arquivos de configuração
if [ ! -f "$TERRAFORM_DIR/terraform.tfvars" ]; then
    echo "❌ Arquivo terraform.tfvars não encontrado!"
    echo "   Copie terraform.tfvars.example e configure suas credenciais"
    exit 1
fi

if [ ! -f "$ANSIBLE_DIR/inventory.ini" ]; then
    echo "⚠️  Arquivo inventory.ini não encontrado. Será criado após Terraform."
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
echo "   ✅ VM criada! IP: $VM_IP"

# Passo 2: Configurar Ansible
echo ""
echo "⚙️  Passo 2: Configurando Ansible..."

cd "$ANSIBLE_DIR"

# Criar inventory se não existir
if [ ! -f "inventory.ini" ]; then
    echo "   Criando inventory.ini..."
    cat > inventory.ini << EOF
[agenda_calendar]
$VM_IP ansible_user=opc ansible_ssh_private_key_file=~/.ssh/id_rsa

[agenda_calendar:vars]
ansible_python_interpreter=/usr/bin/python3
EOF
    echo "   ✅ inventory.ini criado. ATUALIZE a chave SSH se necessário!"
fi

# Atualizar variáveis com IP da VM
echo "   Atualizando variáveis com IP da VM..."
sed -i.bak "s/VM_IP/$VM_IP/g" group_vars/all.yml
rm -f group_vars/all.yml.bak

# Passo 3: Ansible
echo ""
echo "📦 Passo 3: Provisionando VM com Ansible..."

# Aguardar VM estar pronta
echo "   Aguardando VM estar pronta (30 segundos)..."
sleep 30

# Testar conexão
echo "   Testando conexão SSH..."
ansible agenda_calendar -m ping || {
    echo "   ⚠️  Conexão falhou. Aguardando mais 30 segundos..."
    sleep 30
    ansible agenda_calendar -m ping || {
        echo "   ❌ Não foi possível conectar. Verifique:"
        echo "      - SSH key está correta?"
        echo "      - Firewall permite SSH?"
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
echo "   - Backend: http://$VM_IP:3000/health"
echo "   - N8N: http://$VM_IP:5678"
echo ""
echo "🔐 Não esqueça de:"
echo "   1. Alterar senha do N8N em group_vars/all.yml"
echo "   2. Atualizar GOOGLE_REDIRECT_URI no Google Cloud Console"
echo "   3. Configurar workflows no N8N"
