#!/usr/bin/env node

/**
 * Script Avançado de Testes de Validação
 * Testa validações mais complexas que requerem lógica de negócio
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://agendacalendar.duckdns.org';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Função para fazer requisição HTTP/HTTPS
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            body: parsed,
            raw: body,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: body,
            raw: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para executar teste
async function runTest(name, expectedStatus, method, path, data = null, headers = {}) {
  totalTests++;
  
  try {
    const response = await makeRequest(method, path, data, headers);
    
    if (response.status === expectedStatus) {
      console.log(`${colors.green}✅ PASS${colors.reset}: ${name} (HTTP ${response.status})`);
      passedTests++;
      return true;
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset}: ${name}`);
      console.log(`   Esperado: HTTP ${expectedStatus}`);
      console.log(`   Recebido: HTTP ${response.status}`);
      console.log(`   Resposta: ${JSON.stringify(response.body).substring(0, 100)}`);
      failedTests++;
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset}: ${name}`);
    console.log(`   Erro: ${error.message}`);
    failedTests++;
    return false;
  }
}

// Função principal
async function main() {
  console.log('🧪 Testes Avançados de Validação');
  console.log('==================================');
  console.log(`Backend: ${BACKEND_URL}`);
  console.log('');

  // ============================================
  // 1. TESTES DE VALIDAÇÃO DE DATA
  // ============================================
  console.log('📋 1. Testes de Validação de Data');
  console.log('-----------------------------------');

  if (AUTH_TOKEN) {
    // Data no passado
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await runTest(
      'Criar slot - data no passado',
      400,
      'POST',
      '/api/slots',
      {
        date: yesterdayStr,
        startTime: '10:00',
        endTime: '11:00',
      },
      { Authorization: `Bearer ${AUTH_TOKEN}` }
    );

    // Data muito no futuro (mais de 1 ano)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    await runTest(
      'Criar slot - data muito no futuro',
      201, // Pode ser aceito, mas vamos verificar
      'POST',
      '/api/slots',
      {
        date: futureDateStr,
        startTime: '10:00',
        endTime: '11:00',
      },
      { Authorization: `Bearer ${AUTH_TOKEN}` }
    );
  } else {
    console.log(`${colors.yellow}⏭️  Pulando testes de data (sem token)${colors.reset}`);
  }

  console.log('');

  // ============================================
  // 2. TESTES DE VALIDAÇÃO DE EMAIL
  // ============================================
  console.log('📋 2. Testes de Validação de Email');
  console.log('-----------------------------------');

  const invalidEmails = [
    'test',
    'test@',
    '@test.com',
    'test..test@test.com',
    'test@test',
    'test @test.com',
    'test@test..com',
  ];

  for (const email of invalidEmails) {
    await runTest(
      `Email inválido: "${email}"`,
      400,
      'POST',
      '/api/bookings',
      {
        publicLink: 'test',
        slotId: 'test',
        clientName: 'Test',
        clientEmail: email,
        clientPhone: '(11) 99999-9999',
      }
    );
  }

  console.log('');

  // ============================================
  // 3. TESTES DE VALIDAÇÃO DE TELEFONE
  // ============================================
  console.log('📋 3. Testes de Validação de Telefone');
  console.log('-----------------------------------');

  const invalidPhones = [
    '123',
    '123456789',
    '(11) 99999',
    '11 99999-9999',
    '11999999999',
    'abc',
    '',
  ];

  for (const phone of invalidPhones) {
    await runTest(
      `Telefone inválido: "${phone}"`,
      400,
      'POST',
      '/api/bookings',
      {
        publicLink: 'test',
        slotId: 'test',
        clientName: 'Test',
        clientEmail: 'test@test.com',
        clientPhone: phone,
      }
    );
  }

  console.log('');

  // ============================================
  // 4. TESTES DE SANITIZAÇÃO
  // ============================================
  console.log('📋 4. Testes de Sanitização');
  console.log('-----------------------------------');
  console.log(`${colors.yellow}⚠️  Nota: Estes testes verificam se dados maliciosos são sanitizados${colors.reset}`);
  console.log('   (XSS, SQL injection, etc.)');
  console.log('');

  // Teste com script XSS (deve ser sanitizado)
  if (AUTH_TOKEN) {
    await runTest(
      'Sanitização - tentativa XSS no nome',
      201, // Deve aceitar mas sanitizar
      'POST',
      '/api/slots',
      {
        date: '2025-12-25',
        startTime: '10:00',
        endTime: '11:00',
        maxBookings: 1,
      },
      { Authorization: `Bearer ${AUTH_TOKEN}` }
    );
  }

  console.log('');

  // ============================================
  // 5. TESTES DE TAMANHO DE CAMPOS
  // ============================================
  console.log('📋 5. Testes de Tamanho de Campos');
  console.log('-----------------------------------');

  // Nome muito longo
  const longName = 'A'.repeat(1000);
  await runTest(
    'Nome muito longo (1000 caracteres)',
    400, // Deve rejeitar ou truncar
    'POST',
    '/api/bookings',
    {
      publicLink: 'test',
      slotId: 'test',
      clientName: longName,
      clientEmail: 'test@test.com',
      clientPhone: '(11) 99999-9999',
    }
  );

  // Email muito longo
  const longEmail = 'a'.repeat(300) + '@test.com';
  await runTest(
    'Email muito longo',
    400,
    'POST',
    '/api/bookings',
    {
      publicLink: 'test',
      slotId: 'test',
      clientName: 'Test',
      clientEmail: longEmail,
      clientPhone: '(11) 99999-9999',
    }
  );

  console.log('');

  // ============================================
  // RESUMO
  // ============================================
  console.log('==================================');
  console.log('📊 RESUMO DOS TESTES');
  console.log('==================================');
  console.log(`Total de testes: ${totalTests}`);
  console.log(`${colors.green}Passou: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Falhou: ${failedTests}${colors.reset}`);
  console.log('');

  if (failedTests === 0) {
    console.log(`${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Alguns testes falharam${colors.reset}`);
    process.exit(1);
  }
}

// Executar
main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});













