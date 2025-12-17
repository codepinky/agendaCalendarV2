#!/bin/bash

# Script para tentar criar VM na Oracle Cloud automaticamente
# Execute: bash script-tentar-oracle.sh

set -e

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/terraform" && pwd)"
MAX_ATTEMPTS=10
WAIT_HOURS=2

echo "🔄 Script para tentar criar VM na Oracle Cloud automaticamente"
echo "   Tentará a cada $WAIT_HOURS horas, máximo de $MAX_ATTEMPTS tentativas"
echo ""

cd "$TERRAFORM_DIR"

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo "═══════════════════════════════════════════════════════════"
    echo "🔄 Tentativa $attempt de $MAX_ATTEMPTS"
    echo "   Data/Hora: $(date)"
    echo ""
    
    # Tentar criar
    if terraform apply -auto-approve 2>&1 | tee /tmp/terraform-output.log; then
        echo ""
        echo "✅ SUCESSO! VM criada!"
        echo ""
        
        # Mostrar IP
        IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "Verifique no console")
        echo "📋 IP Público: $IP"
        echo ""
        echo "🎯 Próximos passos:"
        echo "   1. Configure o Ansible (veja ../docs/infrastructure/oracle/GUIA_CRIACAO_MANUAL.md)"
        echo "   2. Execute: cd ../ansible && ansible-playbook playbook.yml"
        exit 0
    else
        ERROR=$(grep -i "out of host capacity\|capacity" /tmp/terraform-output.log || echo "Erro desconhecido")
        
        if echo "$ERROR" | grep -qi "out of host capacity"; then
            echo ""
            echo "⚠️  Ainda sem capacidade disponível"
            echo "   Aguardando $WAIT_HOURS horas antes da próxima tentativa..."
            echo ""
            
            if [ $attempt -lt $MAX_ATTEMPTS ]; then
                # Converter horas para segundos (para teste, use minutos)
                WAIT_SECONDS=$((WAIT_HOURS * 3600))
                echo "   (Para teste rápido, aguardando apenas 5 minutos...)"
                sleep 300  # 5 minutos para teste
                # sleep $WAIT_SECONDS  # Descomente para aguardar horas reais
            fi
        else
            echo ""
            echo "❌ Erro diferente encontrado:"
            echo "$ERROR"
            echo ""
            echo "   Verifique o erro acima e corrija antes de continuar."
            exit 1
        fi
    fi
done

echo ""
echo "❌ Máximo de tentativas atingido ($MAX_ATTEMPTS)"
echo "   A capacidade ainda não está disponível."
echo ""
echo "💡 Sugestões:"
echo "   1. Tente manualmente via Console OCI"
echo "   2. Aguarde mais tempo e execute o script novamente"
echo "   3. Tente em horários diferentes (madrugada geralmente tem mais disponibilidade)"

