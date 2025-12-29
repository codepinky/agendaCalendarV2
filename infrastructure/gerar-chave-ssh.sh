#!/bin/bash

# Script para gerar chave SSH se não existir

set -e

SSH_KEY_PATH="$HOME/.ssh/id_rsa"
SSH_PUBLIC_KEY_PATH="$HOME/.ssh/id_rsa.pub"

echo "🔑 Verificando chave SSH..."

if [ -f "$SSH_KEY_PATH" ]; then
    echo "✅ Chave SSH já existe!"
    echo ""
    echo "📋 Sua chave pública:"
    echo "---"
    cat "$SSH_PUBLIC_KEY_PATH"
    echo "---"
    echo ""
    echo "📝 Copie o conteúdo acima para o campo 'ssh_public_key' no terraform.tfvars"
else
    echo "📝 Chave SSH não encontrada. Gerando nova chave..."
    echo ""
    
    read -p "Digite seu e-mail (para identificar a chave): " email
    
    ssh-keygen -t rsa -b 4096 -C "$email" -f "$SSH_KEY_PATH" -N ""
    
    echo ""
    echo "✅ Chave SSH gerada com sucesso!"
    echo ""
    echo "📋 Sua chave pública:"
    echo "---"
    cat "$SSH_PUBLIC_KEY_PATH"
    echo "---"
    echo ""
    echo "📝 Copie o conteúdo acima para o campo 'ssh_public_key' no terraform.tfvars"
    echo ""
    echo "⚠️  IMPORTANTE: Mantenha a chave privada segura!"
    echo "   Local: $SSH_KEY_PATH"
fi















