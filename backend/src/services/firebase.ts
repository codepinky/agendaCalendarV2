import admin from 'firebase-admin';

if (!admin.apps.length) {
  // Converter \n literal para quebras de linha reais
  // O arquivo .env pode ter \n como string literal (dois caracteres: backslash + n)
  // ou já como quebra de linha real
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  
  // Se a chave contém \n literal (dois caracteres), substitui por quebra de linha real
  // Isso acontece quando o .env tem a string "\n" em vez de quebra de linha real
  // Primeiro tenta substituir \\n (escape duplo) por quebra de linha
  privateKey = privateKey.replace(/\\n/g, '\n');
  // Se ainda tiver \n literal (dois caracteres), substitui também
  // Isso cobre casos onde o dotenv não interpretou corretamente
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: privateKey,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Construir nome do bucket usando o formato novo do Firebase
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = projectId ? `${projectId}.firebasestorage.app` : undefined;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: storageBucket,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;









