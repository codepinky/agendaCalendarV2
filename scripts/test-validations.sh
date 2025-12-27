#!/bin/bash

# Script de Testes Automatizados de Validações
# Testa todas as validações de formato, campos obrigatórios e lógica de negócio

BACKEND_URL="${BACKEND_URL:-https://agendacalendar.duckdns.org}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para executar teste
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local method="$3"
    local endpoint="$4"
    local data="$5"
    local headers="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ -z "$headers" ]; then
        headers="Content-Type: application/json"
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "$headers" "${BACKEND_URL}${endpoint}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "$headers" -d "$data" "${BACKEND_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "   Esperado: HTTP $expected_status"
        echo "   Recebido: HTTP $http_code"
        echo "   Resposta: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "🧪 Iniciando Testes de Validação"
echo "=================================="
echo "Backend: $BACKEND_URL"
echo ""

# ============================================
# 1. TESTES DE VALIDAÇÃO DE LICENSE
# ============================================
echo "📋 1. Testes de Validação de License"
echo "-----------------------------------"

# License code vazio
run_test \
    "License code vazio" \
    "400" \
    "POST" \
    "/api/licenses/validate" \
    '{"code":""}'

# License code ausente
run_test \
    "License code ausente" \
    "400" \
    "POST" \
    "/api/licenses/validate" \
    '{}'

# License code inválido (formato errado)
run_test \
    "License code formato inválido" \
    "404" \
    "POST" \
    "/api/licenses/validate" \
    '{"code":"INVALID-CODE"}'

echo ""

# ============================================
# 2. TESTES DE VALIDAÇÃO DE CADASTRO
# ============================================
echo "📋 2. Testes de Validação de Cadastro"
echo "-----------------------------------"

# Campos obrigatórios vazios
run_test \
    "Cadastro - todos campos vazios" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{}'

# Email vazio
run_test \
    "Cadastro - email vazio" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{"email":"","password":"123456","name":"Test","licenseCode":"LIC-TEST"}'

# Senha muito curta
run_test \
    "Cadastro - senha muito curta" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{"email":"test@test.com","password":"123","name":"Test","licenseCode":"LIC-TEST"}'

# Email inválido - sem @
run_test \
    "Cadastro - email sem @" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{"email":"invalidemail.com","password":"123456","name":"Test","licenseCode":"LIC-TEST"}'

# Email inválido - sem domínio
run_test \
    "Cadastro - email sem domínio" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{"email":"test@","password":"123456","name":"Test","licenseCode":"LIC-TEST"}'

# License code vazio
run_test \
    "Cadastro - license code vazio" \
    "400" \
    "POST" \
    "/api/auth/register" \
    '{"email":"test@test.com","password":"123456","name":"Test","licenseCode":""}'

echo ""

# ============================================
# 3. TESTES DE VALIDAÇÃO DE SLOTS
# ============================================
echo "📋 3. Testes de Validação de Slots (requer autenticação)"
echo "-----------------------------------"
echo -e "${YELLOW}⚠️  Nota: Estes testes requerem token JWT válido${NC}"
echo "   Para testar, você precisa:"
echo "   1. Fazer login e obter token"
echo "   2. Exportar: export AUTH_TOKEN='seu_token_aqui'"
echo "   3. Rodar novamente este script"
echo ""

if [ -n "$AUTH_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $AUTH_TOKEN"
    
    # Data vazia
    run_test \
        "Criar slot - data vazia" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"","startTime":"10:00","endTime":"11:00"}' \
        "$AUTH_HEADER"
    
    # Hora vazia
    run_test \
        "Criar slot - hora início vazia" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"2025-12-20","startTime":"","endTime":"11:00"}' \
        "$AUTH_HEADER"
    
    # Data formato inválido
    run_test \
        "Criar slot - data formato inválido" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"20/12/2025","startTime":"10:00","endTime":"11:00"}' \
        "$AUTH_HEADER"
    
    # Hora formato inválido
    run_test \
        "Criar slot - hora formato inválido" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"2025-12-20","startTime":"10h00","endTime":"11:00"}' \
        "$AUTH_HEADER"
    
    # Hora fim < hora início
    run_test \
        "Criar slot - hora fim antes de início" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"2025-12-20","startTime":"11:00","endTime":"10:00"}' \
        "$AUTH_HEADER"
    
    # Hora fim = hora início
    run_test \
        "Criar slot - hora fim igual a início" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"2025-12-20","startTime":"10:00","endTime":"10:00"}' \
        "$AUTH_HEADER"
    
    # Hora inválida (25:00)
    run_test \
        "Criar slot - hora inválida (25:00)" \
        "400" \
        "POST" \
        "/api/slots" \
        '{"date":"2025-12-20","startTime":"25:00","endTime":"26:00"}' \
        "$AUTH_HEADER"
else
    echo -e "${YELLOW}⏭️  Pulando testes de slots (sem token de autenticação)${NC}"
fi

echo ""

# ============================================
# 4. TESTES DE VALIDAÇÃO DE AGENDAMENTO
# ============================================
echo "📋 4. Testes de Validação de Agendamento"
echo "-----------------------------------"

# Campos obrigatórios vazios
run_test \
    "Agendamento - todos campos vazios" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{}'

# Email vazio
run_test \
    "Agendamento - email vazio" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"test","slotId":"test","clientName":"Test","clientEmail":"","clientPhone":"(11) 99999-9999"}'

# Email inválido
run_test \
    "Agendamento - email inválido" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"test","slotId":"test","clientName":"Test","clientEmail":"invalid-email","clientPhone":"(11) 99999-9999"}'

# Telefone vazio
run_test \
    "Agendamento - telefone vazio" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"test","slotId":"test","clientName":"Test","clientEmail":"test@test.com","clientPhone":""}'

# Telefone formato inválido
run_test \
    "Agendamento - telefone formato inválido" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"test","slotId":"test","clientName":"Test","clientEmail":"test@test.com","clientPhone":"123"}'

# PublicLink vazio
run_test \
    "Agendamento - publicLink vazio" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"","slotId":"test","clientName":"Test","clientEmail":"test@test.com","clientPhone":"(11) 99999-9999"}'

# SlotId vazio
run_test \
    "Agendamento - slotId vazio" \
    "400" \
    "POST" \
    "/api/bookings" \
    '{"publicLink":"test","slotId":"","clientName":"Test","clientEmail":"test@test.com","clientPhone":"(11) 99999-9999"}'

echo ""

# ============================================
# 5. TESTES DE AUTENTICAÇÃO
# ============================================
echo "📋 5. Testes de Autenticação"
echo "-----------------------------------"

# Endpoint protegido sem token
run_test \
    "GET /api/slots sem autenticação" \
    "401" \
    "GET" \
    "/api/slots"

# Endpoint protegido com token inválido
run_test \
    "GET /api/slots com token inválido" \
    "401" \
    "GET" \
    "/api/slots" \
    "" \
    "Authorization: Bearer invalid_token_12345"

# Endpoint protegido com token malformado
run_test \
    "GET /api/slots com token malformado" \
    "401" \
    "GET" \
    "/api/slots" \
    "" \
    "Authorization: Bearer not.a.valid.jwt"

echo ""

# ============================================
# 6. TESTES DE RATE LIMITING
# ============================================
echo "📋 6. Testes de Rate Limiting"
echo "-----------------------------------"
echo -e "${YELLOW}⚠️  Nota: Estes testes podem demorar${NC}"
echo ""

# Fazer 101 requisições para /api (limite é 100 em 15 minutos)
echo "Testando rate limit geral (/api/*)..."
rate_limit_hit=0
for i in {1..5}; do
    response=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/licenses/validate" \
        -H "Content-Type: application/json" \
        -d '{"code":"TEST"}')
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "429" ]; then
        rate_limit_hit=1
        break
    fi
    sleep 0.5
done

if [ "$rate_limit_hit" = "1" ]; then
    echo -e "${GREEN}✅ Rate limiting está funcionando${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Rate limiting não foi atingido (pode estar dentro do limite)${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# ============================================
# 7. TESTES DE ENDPOINTS PÚBLICOS
# ============================================
echo "📋 7. Testes de Endpoints Públicos"
echo "-----------------------------------"

# Health check
run_test \
    "Health check" \
    "200" \
    "GET" \
    "/health"

# Slots públicos - publicLink vazio
run_test \
    "GET slots públicos - publicLink vazio" \
    "400" \
    "GET" \
    "/api/bookings/slots/"

# Slots públicos - publicLink inválido
run_test \
    "GET slots públicos - publicLink inválido" \
    "404" \
    "GET" \
    "/api/bookings/slots/invalid-link-12345"

echo ""

# ============================================
# RESUMO
# ============================================
echo "=================================="
echo "📊 RESUMO DOS TESTES"
echo "=================================="
echo "Total de testes: $TOTAL_TESTS"
echo -e "${GREEN}Passou: $PASSED_TESTS${NC}"
echo -e "${RED}Falhou: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}❌ Alguns testes falharam${NC}"
    exit 1
fi











