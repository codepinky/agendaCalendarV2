#!/usr/bin/env node

/**
 * Script para fazer queries no Firestore
 * 
 * Uso:
 *   node scripts/firestore-query.js users
 *   node scripts/firestore-query.js users/user123/availableSlots
 *   node scripts/firestore-query.js users/user123/bookings --where status=confirmed
 */

// Carregar variáveis de ambiente do backend
const pathModule = require('path');
const fs = require('fs');
const envPath = pathModule.join(__dirname, '../backend/.env');

if (fs.existsSync(envPath)) {
  // Usar dotenv do backend
  const dotenv = require(pathModule.join(__dirname, '../backend/node_modules/dotenv'));
  dotenv.config({ path: envPath });
} else {
  // Tentar usar variáveis de ambiente do sistema
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('❌ Arquivo .env não encontrado em backend/.env');
    console.error('   E variáveis de ambiente não estão configuradas.');
    console.error('   Crie o arquivo backend/.env ou configure as variáveis de ambiente.');
    process.exit(1);
  }
  console.log('⚠️  Usando variáveis de ambiente do sistema (arquivo .env não encontrado)');
}

// Usar firebase-admin do backend
const admin = require(pathModule.join(__dirname, '../backend/node_modules/firebase-admin'));

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function queryCollection(path, filters = {}) {
  try {
    const pathParts = path.split('/');
    let ref = db.collection(pathParts[0]);

    // Navegar por subcoleções se necessário
    for (let i = 1; i < pathParts.length; i += 2) {
      if (pathParts[i + 1]) {
        ref = ref.doc(pathParts[i]).collection(pathParts[i + 1]);
      } else {
        ref = ref.doc(pathParts[i]);
      }
    }

    // Aplicar filtros
    let query = ref;
    if (filters.where) {
      filters.where.forEach(filter => {
        const [field, operator, value] = filter.split('=');
        if (operator === '==') {
          query = query.where(field, '==', value);
        } else if (operator === 'in') {
          query = query.where(field, 'in', value.split(','));
        } else if (operator === '>=') {
          query = query.where(field, '>=', value);
        }
      });
    }

    // Executar query
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('Nenhum documento encontrado.');
      return;
    }

    console.log(`\n📊 ${snapshot.size} documento(s) encontrado(s):\n`);
    
    snapshot.forEach((doc, index) => {
      console.log(`--- Documento ${index + 1} (ID: ${doc.id}) ---`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const path = args[0];
const filters = {};

// Parse filters (--where field=operator=value)
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--where' && args[i + 1]) {
    if (!filters.where) filters.where = [];
    filters.where.push(args[i + 1]);
    i++;
  }
}

if (!path) {
  console.log(`
Uso: node scripts/firestore-query.js <caminho> [opções]

Exemplos:
  # Listar todos os usuários
  node scripts/firestore-query.js users

  # Listar slots de um usuário
  node scripts/firestore-query.js users/user123/availableSlots

  # Listar bookings confirmados
  node scripts/firestore-query.js users/user123/bookings --where status==confirmed

  # Listar slots disponíveis
  node scripts/firestore-query.js users/user123/availableSlots --where status==available
  `);
  process.exit(1);
}

queryCollection(path, filters).then(() => {
  process.exit(0);
});

