#!/bin/bash

# Script rápido para deploy apenas do backend (sem provisionar tudo)
# Uso: ./scripts/deploy-backend-quick.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Ansible está instalado
if ! command -v ansible-playbook &> /dev/null; then
    echo -e "${RED}❌ Ansible não encontrado. Instale: pip3 install ansible${NC}"
    exit 1
fi

# Verificar se inventory.ini existe
INVENTORY_FILE="infrastructure/ansible/inventory.ini"
if [ ! -f "$INVENTORY_FILE" ]; then
    echo -e "${RED}❌ Arquivo $INVENTORY_FILE não encontrado!${NC}"
    echo "   Crie o arquivo com o IP da sua VM:"
    echo "   [agenda_calendar]"
    echo "   54.207.236.103 ansible_user=ec2-user ansible_ssh_private_key_file=~/.ssh/id_rsa"
    exit 1
fi

# Verificar se o IP está configurado
if grep -q "SEU_IP_OU_HOST_AQUI" "$INVENTORY_FILE"; then
    echo -e "${RED}❌ IP da VM não configurado em $INVENTORY_FILE${NC}"
    echo "   Edite o arquivo e substitua SEU_IP_OU_HOST_AQUI pelo IP da sua VM"
    exit 1
fi

echo -e "${GREEN}🚀 Iniciando deploy do backend...${NC}"
echo ""

# Ir para o diretório do Ansible
cd "$(dirname "$0")/../infrastructure/ansible"

# Executar apenas o role do backend
echo -e "${YELLOW}📦 Sincronizando arquivos e fazendo deploy...${NC}"
ansible-playbook playbook.yml --tags deploy --limit agenda_calendar

echo ""
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📋 Verificações:"
echo "   - Arquivos sincronizados"
echo "   - Dependências instaladas"
echo "   - Build executado"
echo "   - Serviço reiniciado"
echo ""
echo "🔍 Teste o health check:"
echo "   curl https://agendacalendar.duckdns.org/health"

