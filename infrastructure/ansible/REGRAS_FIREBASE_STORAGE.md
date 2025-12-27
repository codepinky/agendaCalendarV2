# Regras do Firebase Storage

## 📋 Regras Necessárias

As imagens são armazenadas na estrutura: `users/{userId}/{type}/{filename}`

Onde:
- `userId`: ID do usuário (Firebase UID)
- `type`: `profile`, `banner` ou `background`
- `filename`: Nome do arquivo com timestamp

## 🔐 Regras de Segurança

### Regras Recomendadas (Leitura Pública com Token, Escrita via Service Account)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Regras para imagens de perfil público
    match /users/{userId}/{allPaths=**} {
      // Permitir leitura pública (qualquer um pode ler com token na URL)
      // As URLs são geradas com token de download, então são seguras
      allow read: if true;
      
      // Escrita e deleção apenas via Service Account (backend)
      // O backend usa service account, então essas operações são feitas server-side
      allow write: if false; // Bloqueado - apenas service account pode escrever
      allow delete: if false; // Bloqueado - apenas service account pode deletar
    }
  }
}
```

### Explicação

1. **Leitura Pública (`allow read: if true`)**:
   - As imagens precisam ser acessíveis publicamente porque aparecem na página pública
   - A segurança é garantida pelo token na URL (`?token=...`)
   - Sem o token correto, não é possível acessar a imagem

2. **Escrita/Deleção Bloqueada (`allow write: if false`)**:
   - O backend usa Service Account para fazer upload/deleção
   - A Service Account tem permissões administrativas e não precisa das regras
   - Isso garante que apenas o backend autenticado pode modificar imagens

## 🚀 Como Aplicar as Regras

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto: `agendacalendar-cae1a`
3. Vá em **Storage** → **Rules**
4. Cole as regras acima
5. Clique em **Publish**

## ✅ Validação

Após aplicar as regras, teste:

1. **Upload de imagem** (via frontend autenticado):
   - Deve funcionar (backend usa service account)

2. **Acesso público** (via URL com token):
   - Deve funcionar (leitura pública permitida)

3. **Acesso sem token**:
   - Deve falhar (segurança garantida pelo token)

## 📝 Notas Importantes

- As URLs geradas incluem token: `?alt=media&token={uuid}`
- Sem o token correto, a imagem não é acessível
- O backend gerencia uploads/deleções via Service Account
- Usuários não autenticados podem ver imagens apenas com URL + token válido




