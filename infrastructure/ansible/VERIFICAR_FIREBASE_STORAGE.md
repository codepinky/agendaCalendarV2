# Verificar Firebase Storage

## ⚠️ Problema: Erro 500 ao fazer upload de imagens

Se você está recebendo erro 500 ao tentar fazer upload de imagens, verifique se o Firebase Storage está habilitado.

## ✅ Passos para Verificar e Habilitar

### 1. Acesse o Firebase Console
- https://console.firebase.google.com/project/agendacalendar-cae1a

### 2. Verifique se Storage está habilitado
- No menu lateral, procure por **"Storage"**
- Se não aparecer, você precisa habilitar

### 3. Habilitar Storage (se necessário)
1. Clique em **"Storage"** no menu lateral
2. Se aparecer uma tela de "Get started", clique em **"Get started"**
3. Escolha o modo:
   - **Production mode** (recomendado) - com regras de segurança
   - **Test mode** - sem regras (apenas para testes)
4. Selecione a localização do bucket (ex: `us-central1`)
5. Clique em **"Done"**

### 4. Verificar o bucket padrão
- O bucket padrão deve ser: `agendacalendar-cae1a.appspot.com`
- Você pode verificar isso em **Storage** → **Files** → verificar o nome do bucket no topo

### 5. Aplicar regras do Storage
- Vá em **Storage** → **Rules**
- Cole as regras do arquivo `storage.rules`
- Clique em **"Publish"**

## 🔍 Verificar se está funcionando

Após habilitar o Storage:
1. Tente fazer upload de uma imagem novamente
2. Se ainda der erro, verifique os logs do backend:
   ```bash
   ssh ec2-user@agendacalendar.duckdns.org
   sudo journalctl -u agenda-calendar-backend -n 50 --no-pager
   ```

## 📝 Notas

- O Firebase Storage precisa estar habilitado no projeto
- O bucket padrão é criado automaticamente quando você habilita o Storage
- As regras de segurança são importantes para proteger os arquivos




