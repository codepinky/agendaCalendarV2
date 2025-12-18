#!/bin/bash

# Script para tentar criar VM na região de São Paulo
# Execute: bash tentar-criar-vm.sh

set -e

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/terraform" && pwd)"
MAX_ATTEMPTS=5
WAIT_MINUTES=10

echo "🔄 Tentando criar VM na região de São Paulo (sa-saopaulo-1)"
echo "   Tentará $MAX_ATTEMPTS vezes, aguardando $WAIT_MINUTES minutos entre tentativas"
echo ""

cd "$TERRAFORM_DIR"

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo "═══════════════════════════════════════════════════════════"
    echo "🔄 Tentativa $attempt de $MAX_ATTEMPTS"
    echo "   Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Verificar se já existe a VM
    if terraform state list | grep -q "oci_core_instance.agenda_calendar_vm"; then
        echo "✅ VM já existe!"
        IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "Verifique no console")
        echo "📋 IP Público: $IP"
        exit 0
    fi
    
    # Tentar criar apenas a VM
    echo "🏗️  Tentando criar VM..."
    if terraform apply -target=oci_core_instance.agenda_calendar_vm -auto-approve 2>&1 | tee /tmp/terraform-vm-output.log; then
        echo ""
        echo "✅ SUCESSO! VM criada!"
        echo ""
        
        # Mostrar IP
        IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "Verifique no console")
        echo "📋 IP Público: $IP"
        echo ""
        echo "🎯 Próximos passos:"
        echo "   1. Configure o Ansible:"
        echo "      cd ../ansible"
        echo "      cp inventory.ini.example inventory.ini"
        echo "      # Edite inventory.ini com o IP: $IP"
        echo ""
        echo "   2. Execute o provisionamento:"
        echo "      ansible-playbook playbook.yml"
        exit 0
    else
        ERROR=$(grep -i "out of host capacity\|capacity" /tmp/terraform-vm-output.log || echo "")
        
        if echo "$ERROR" | grep -qi "out of host capacity"; then
            echo ""
            echo "⚠️  Ainda sem capacidade disponível na região de São Paulo"
            
            if [ $attempt -lt $MAX_ATTEMPTS ]; then
                echo "   Aguardando $WAIT_MINUTES minutos antes da próxima tentativa..."
                echo ""
                sleep $((WAIT_MINUTES * 60))
            else
                echo ""
                echo "❌ Máximo de tentativas atingido ($MAX_ATTEMPTS)"
                echo ""
                echo "💡 Sugestões:"
                echo "   1. Tente novamente mais tarde (madrugada geralmente tem mais disponibilidade)"
                echo "   2. Tente criar manualmente via Console OCI"
                echo "   3. Considere usar outra região temporariamente"
                exit 1
            fi
        else
            echo ""
            echo "❌ Erro diferente encontrado:"
            cat /tmp/terraform-vm-output.log | tail -20
            echo ""
            echo "   Verifique o erro acima e corrija antes de continuar."
            exit 1
        fi
    fi
done


