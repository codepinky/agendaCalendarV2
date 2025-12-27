#!/bin/bash

# Script para destruir/excluir a infraestrutura AWS criada com Terraform
# Execute como: bash destroy-aws.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/terraform-aws"

echo "🗑️  Destruindo infraestrutura AWS..."
echo ""

# Verificar se Terraform está instalado
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform não encontrado. Instale: https://www.terraform.io/downloads"
    exit 1
fi

# Verificar se o diretório terraform-aws existe
if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Diretório terraform-aws não encontrado!"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Verificar se o Terraform foi inicializado
if [ ! -d ".terraform" ]; then
    echo "⚠️  Terraform não foi inicializado. Inicializando agora..."
    terraform init
fi

# Verificar se há recursos para destruir
if ! terraform state list &> /dev/null; then
    echo "⚠️  Nenhum recurso encontrado no estado do Terraform."
    echo "   A infraestrutura pode já ter sido destruída ou nunca foi criada."
    exit 0
fi

# Mostrar recursos que serão destruídos
echo "📋 Recursos que serão destruídos:"
terraform state list
echo ""

# Confirmar destruição
read -p "⚠️  ATENÇÃO: Isso irá destruir TODOS os recursos acima. Continuar? (yes/no) " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Operação cancelada."
    exit 0
fi

# Executar destroy
echo "🗑️  Destruindo recursos..."
terraform destroy

echo ""
echo "✅ Infraestrutura destruída com sucesso!"
echo ""
echo "📋 Recursos removidos:"
echo "   - EC2 Instance (VM)"
echo "   - Security Group"
echo "   - Key Pair"
echo ""
echo "💡 Nota: O VPC padrão não é removido (é gratuito e pode ser usado por outros recursos)"













