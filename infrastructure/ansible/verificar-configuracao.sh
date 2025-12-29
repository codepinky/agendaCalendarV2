#!/bin/bash

# Script para verificar se todas as configurações estão corretas

echo "🔍 Verificando configuração do sistema..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "inventory.ini" ]; then
    echo -e "${RED}❌ Execute este script do diretório infrastructure/ansible${NC}"
    exit 1
fi

echo "📋 Verificando arquivo group_vars/all.yml..."
if grep -q "SEU_FIREBASE_PROJECT_ID\|SUA_CHAVE_AQUI\|SEU_FIREBASE_CLIENT_EMAIL" group_vars/all.yml; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: group_vars/all.yml ainda tem valores placeholder!${NC}"
    echo "   Edite o arquivo e substitua pelos valores reais."
else
    echo -e "${GREEN}✅ group_vars/all.yml parece estar configurado${NC}"
fi

echo ""
echo "🌐 Verificando backend na VM..."
if ansible agenda_calendar -m shell -a "systemctl is-active agenda-calendar-backend" 2>/dev/null | grep -q "active"; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
else
    echo -e "${RED}❌ Backend NÃO está rodando${NC}"
    echo "   Execute: ansible agenda_calendar -m shell -a 'sudo systemctl status agenda-calendar-backend'"
fi

echo ""
echo "🔗 Verificando rotas de upload..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://agendacalendar.duckdns.org/api/health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (HTTP $HEALTH_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Health check falhou (HTTP $HEALTH_RESPONSE)${NC}"
fi

UPLOAD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://agendacalendar.duckdns.org/api/users/upload/profile-image -H "Authorization: Bearer test" -F "image=@/dev/null" 2>/dev/null)
if [ "$UPLOAD_RESPONSE" = "401" ] || [ "$UPLOAD_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ Rota de upload existe (HTTP $UPLOAD_RESPONSE - esperado para não autenticado)${NC}"
elif [ "$UPLOAD_RESPONSE" = "404" ]; then
    echo -e "${RED}❌ Rota de upload NÃO encontrada (HTTP 404)${NC}"
    echo "   Execute: ansible-playbook playbook.app.yml --tags backend"
else
    echo -e "${YELLOW}⚠️  Resposta inesperada da rota de upload (HTTP $UPLOAD_RESPONSE)${NC}"
fi

echo ""
echo "📦 Verificando dependências do backend..."
if ansible agenda_calendar -m shell -a "test -f /opt/agenda-calendar/backend/node_modules/multer/package.json && test -f /opt/agenda-calendar/backend/node_modules/uuid/package.json" 2>/dev/null; then
    echo -e "${GREEN}✅ Dependências instaladas (multer, uuid)${NC}"
else
    echo -e "${YELLOW}⚠️  Dependências podem não estar instaladas${NC}"
    echo "   Execute: ansible-playbook playbook.app.yml --tags backend"
fi

echo ""
echo "🔐 Verificando .env na VM..."
ENV_CHECK=$(ansible agenda_calendar -m shell -a "grep -q 'SUA_CHAVE_AQUI\|SEU_FIREBASE_PROJECT_ID' /opt/agenda-calendar/backend/.env 2>/dev/null && echo 'has_placeholders' || echo 'ok'" 2>/dev/null)
if [ "$ENV_CHECK" = "has_placeholders" ]; then
    echo -e "${RED}❌ .env na VM ainda tem valores placeholder!${NC}"
    echo "   Edite: ssh ec2-user@54.207.236.103"
    echo "   Arquivo: /opt/agenda-calendar/backend/.env"
else
    echo -e "${GREEN}✅ .env na VM parece estar configurado${NC}"
fi

echo ""
echo "📄 Verificando arquivo de configuração..."
if [ -f "CONFIGURACAO_COMPLETA.md" ]; then
    echo -e "${GREEN}✅ Documentação de configuração encontrada${NC}"
    echo "   Leia: infrastructure/ansible/CONFIGURACAO_COMPLETA.md"
else
    echo -e "${YELLOW}⚠️  Documentação não encontrada${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificação concluída!"
echo ""
echo "📚 Próximos passos:"
echo "   1. Configure as variáveis no group_vars/all.yml"
echo "   2. Ou edite diretamente o .env na VM"
echo "   3. Reinicie o backend: sudo systemctl restart agenda-calendar-backend"
echo "   4. Teste o upload de imagens no frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"






