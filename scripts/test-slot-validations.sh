#!/bin/bash

# Script para testar validações de slots
# Testa: data/hora no passado, buffer entre slots, múltiplos slots no mesmo dia

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testando Validações de Slots"
echo "Backend URL: $BACKEND_URL"
echo ""

# Função para fazer requisição
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  local description=$5
  
  if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Token de autenticação não fornecido. Alguns testes serão pulados.${NC}"
    echo "   Defina AUTH_TOKEN para testar endpoints protegidos"
    return 1
  fi
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -d "$data" \
      "$BACKEND_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X GET \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$BACKEND_URL$endpoint")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ $description${NC}"
    echo "   Status: $http_code (esperado: $expected_status)"
    return 0
  else
    echo -e "${RED}❌ $description${NC}"
    echo "   Status: $http_code (esperado: $expected_status)"
    echo "   Resposta: $body"
    return 1
  fi
}

# Teste 1: Criar slot com data no passado
echo "📅 Teste 1: Criar slot com data no passado"
yesterday=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
make_request "POST" "/api/slots" \
  "{\"date\":\"$yesterday\",\"startTime\":\"10:00\",\"endTime\":\"11:00\",\"bufferMinutes\":0}" \
  "400" \
  "Deve retornar erro 400 para data no passado"

echo ""

# Teste 2: Criar slot hoje com hora no passado
echo "⏰ Teste 2: Criar slot hoje com hora no passado"
today=$(date +%Y-%m-%d)
past_hour=$(date -v-1H +%H:%M 2>/dev/null || date -d "1 hour ago" +%H:%M)
make_request "POST" "/api/slots" \
  "{\"date\":\"$today\",\"startTime\":\"$past_hour\",\"endTime\":\"23:59\",\"bufferMinutes\":0}" \
  "400" \
  "Deve retornar erro 400 para hora no passado (se data for hoje)"

echo ""

# Teste 3: Criar slot com hora fim < hora início
echo "🕐 Teste 3: Criar slot com hora fim < hora início"
tomorrow=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "tomorrow" +%Y-%m-%d)
make_request "POST" "/api/slots" \
  "{\"date\":\"$tomorrow\",\"startTime\":\"14:00\",\"endTime\":\"13:00\",\"bufferMinutes\":0}" \
  "400" \
  "Deve retornar erro 400 quando hora fim < hora início"

echo ""

# Teste 4: Criar slot válido
echo "✅ Teste 4: Criar slot válido"
future_date=$(date -v+2d +%Y-%m-%d 2>/dev/null || date -d "2 days" +%Y-%m-%d)
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"10:00\",\"endTime\":\"11:00\",\"bufferMinutes\":0}" \
  "201" \
  "Deve criar slot válido com sucesso"

echo ""

# Teste 5: Criar slot com conflito direto (sobreposição)
echo "⚠️  Teste 5: Criar slot com conflito direto"
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"10:30\",\"endTime\":\"11:30\",\"bufferMinutes\":0}" \
  "409" \
  "Deve retornar erro 409 para conflito de horário"

echo ""

# Teste 6: Criar slot com buffer insuficiente
echo "⏱️  Teste 6: Criar slot com buffer insuficiente"
# Primeiro criar um slot com buffer de 60 minutos
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"13:00\",\"endTime\":\"14:00\",\"bufferMinutes\":60}" \
  "201" \
  "Criar slot com buffer de 60 minutos"

# Tentar criar slot 14:01-15:00 (apenas 1 minuto após, precisa de 60)
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"14:01\",\"endTime\":\"15:00\",\"bufferMinutes\":0}" \
  "409" \
  "Deve retornar erro 409 quando buffer não é respeitado"

echo ""

# Teste 7: Criar slot respeitando buffer
echo "✅ Teste 7: Criar slot respeitando buffer"
# Criar slot 15:00-16:00 (60 minutos após o slot anterior terminar)
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"15:00\",\"endTime\":\"16:00\",\"bufferMinutes\":0}" \
  "201" \
  "Deve criar slot respeitando buffer de 60 minutos"

echo ""

# Teste 8: Criar múltiplos slots no mesmo dia (sem conflito)
echo "📆 Teste 8: Criar múltiplos slots no mesmo dia"
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"16:00\",\"endTime\":\"17:00\",\"bufferMinutes\":0}" \
  "201" \
  "Deve criar múltiplos slots no mesmo dia sem conflito"

make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"17:00\",\"endTime\":\"18:00\",\"bufferMinutes\":0}" \
  "201" \
  "Deve criar segundo slot no mesmo dia"

echo ""

# Teste 9: Validar formato de data inválido
echo "📝 Teste 9: Validar formato de data inválido"
make_request "POST" "/api/slots" \
  "{\"date\":\"20/12/2025\",\"startTime\":\"10:00\",\"endTime\":\"11:00\",\"bufferMinutes\":0}" \
  "400" \
  "Deve retornar erro 400 para formato de data inválido"

echo ""

# Teste 10: Validar formato de hora inválido
echo "📝 Teste 10: Validar formato de hora inválido"
make_request "POST" "/api/slots" \
  "{\"date\":\"$future_date\",\"startTime\":\"10h00\",\"endTime\":\"11:00\",\"bufferMinutes\":0}" \
  "400" \
  "Deve retornar erro 400 para formato de hora inválido"

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testes concluídos!"
echo ""
echo "📋 Resumo:"
echo "   - Testes de validação de data/hora no passado"
echo "   - Testes de conflito de horários"
echo "   - Testes de buffer entre slots"
echo "   - Testes de múltiplos slots no mesmo dia"
echo "   - Testes de formato de dados"
echo ""
echo "💡 Para usar este script:"
echo "   export BACKEND_URL='https://seu-backend.com'"
echo "   export AUTH_TOKEN='seu_token_jwt'"
echo "   ./scripts/test-slot-validations.sh"









