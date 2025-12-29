#!/bin/bash

# Script para conectar ao Windows/WSL2 do Mac
# Uso: ./conectar-windows.sh [IP_DO_WINDOWS] [USUARIO]

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações padrão
DEFAULT_PORT=2222
DEFAULT_USER="${USER}"

# Parâmetros
WINDOWS_IP="${1:-}"
WSL_USER="${2:-$DEFAULT_USER}"

echo -e "${CYAN}🔌 Conectando ao Windows/WSL2...${NC}"
echo ""

# Se não forneceu IP, tentar descobrir ou pedir
if [ -z "$WINDOWS_IP" ]; then
    # Verificar se existe configuração no ~/.ssh/config
    if grep -q "Host windows-wsl" ~/.ssh/config 2>/dev/null; then
        echo -e "${YELLOW}📋 Configuração encontrada no ~/.ssh/config${NC}"
        echo -e "${GREEN}Conectando via: ssh windows-wsl${NC}"
        echo ""
        ssh windows-wsl
        exit 0
    else
        echo -e "${YELLOW}⚠️  IP do Windows não fornecido${NC}"
        echo ""
        echo "Uso: $0 [IP_DO_WINDOWS] [USUARIO]"
        echo ""
        echo "Ou configure no ~/.ssh/config:"
        echo ""
        echo "Host windows-wsl"
        echo "    HostName SEU_IP_AQUI"
        echo "    Port 2222"
        echo "    User $WSL_USER"
        echo ""
        echo "Depois execute: ssh windows-wsl"
        exit 1
    fi
fi

# Testar conexão
echo -e "${CYAN}🔍 Testando conexão...${NC}"
if timeout 3 bash -c "echo > /dev/tcp/$WINDOWS_IP/$DEFAULT_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ Porta $DEFAULT_PORT está acessível${NC}"
else
    echo -e "${RED}❌ Não foi possível conectar na porta $DEFAULT_PORT${NC}"
    echo ""
    echo "Verifique:"
    echo "  1. Windows está ligado e na mesma rede?"
    echo "  2. Script setup-wsl-ssh.ps1 foi executado no Windows?"
    echo "  3. Firewall do Windows permite conexões na porta 2222?"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Conectando...${NC}"
echo -e "${CYAN}   ssh -p $DEFAULT_PORT $WSL_USER@$WINDOWS_IP${NC}"
echo ""

# Conectar
ssh -p "$DEFAULT_PORT" "$WSL_USER@$WINDOWS_IP"














