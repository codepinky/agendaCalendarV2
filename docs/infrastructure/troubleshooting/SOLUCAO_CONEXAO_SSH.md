# 🔧 Solução: Erro de Conexão SSH com AWS

## 🔍 Diagnóstico

O problema é que:
- ✅ A chave privada **está correta** (`~/.ssh/id_rsa`)
- ✅ A chave pública foi importada corretamente na AWS
- ⚠️ A AWS mostra o nome do Key Pair como `agenda-calendar-key.pem`
- ⚠️ Mas seu arquivo local se chama `id_rsa` (sem extensão `.pem`)

**O SSH funciona com qualquer nome de arquivo**, desde que seja a chave privada correta!

## ✅ Solução 1: Usar a chave existente (Recomendado)

Use diretamente o arquivo `id_rsa`:

```bash
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

**Ou com o DNS:**

```bash
ssh -i ~/.ssh/id_rsa ec2-user@ec2-56-125-217-149.sa-east-1.compute.amazonaws.com
```

## ✅ Solução 2: Criar cópia com nome .pem (Opcional)

Se preferir usar o nome que a AWS mostra:

```bash
# Criar cópia com nome .pem
cp ~/.ssh/id_rsa ~/.ssh/agenda-calendar-key.pem

# Ajustar permissões (importante!)
chmod 400 ~/.ssh/agenda-calendar-key.pem

# Usar a cópia
ssh -i ~/.ssh/agenda-calendar-key.pem ec2-user@56.125.217.149
```

## 🔐 Verificar Permissões

**Importante:** A chave privada precisa ter permissões restritas:

```bash
# Verificar permissões atuais
ls -la ~/.ssh/id_rsa

# Deve mostrar: -rw------- (600)
# Se não estiver assim, ajustar:
chmod 600 ~/.ssh/id_rsa
```

## 🧪 Testar Conexão

```bash
# Teste rápido
ssh -i ~/.ssh/id_rsa -o ConnectTimeout=10 ec2-user@56.125.217.149 "echo 'Conexão OK!'"
```

**Se funcionar, você verá:**
```
Conexão OK!
```

## 🆘 Erros Comuns e Soluções

### Erro: "Permission denied (publickey)"

**Causa:** Permissões incorretas na chave privada

**Solução:**
```bash
chmod 600 ~/.ssh/id_rsa
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

### Erro: "WARNING: UNPROTECTED PRIVATE KEY FILE!"

**Causa:** Permissões muito abertas (mais de 600)

**Solução:**
```bash
chmod 600 ~/.ssh/id_rsa
```

### Erro: "Connection timed out"

**Causa:** Security Group não permite SSH ou VM não está rodando

**Solução:**
```bash
# Verificar se VM está rodando
aws ec2 describe-instances --instance-ids i-0443fa9bc059caeb3 --region sa-east-1 --query 'Reservations[*].Instances[*].State.Name' --output text

# Verificar Security Group
aws ec2 describe-security-groups --group-names agenda-calendar-sg --region sa-east-1 --query 'SecurityGroups[*].IpPermissions[?FromPort==`22`]'
```

### Erro: "Host key verification failed"

**Solução:**
```bash
# Remover entrada antiga
ssh-keygen -R 56.125.217.149

# Tentar novamente
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

## 📝 Comandos SSH Completos

### Com IP:
```bash
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

### Com DNS:
```bash
ssh -i ~/.ssh/id_rsa ec2-user@ec2-56-125-217-149.sa-east-1.compute.amazonaws.com
```

### Com verbose (para debug):
```bash
ssh -v -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

## 💡 Dica: Configurar SSH Config

Para facilitar, adicione ao `~/.ssh/config`:

```bash
nano ~/.ssh/config
```

**Adicione:**

```
Host agenda-calendar-aws
    HostName 56.125.217.149
    User ec2-user
    IdentityFile ~/.ssh/id_rsa
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Depois, conecte simplesmente com:**

```bash
ssh agenda-calendar-aws
```

## ✅ Resumo

- ✅ Sua chave `id_rsa` **é a chave correta**
- ✅ O nome `.pem` é apenas uma convenção da AWS
- ✅ Use: `ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149`
- ✅ Ajuste permissões: `chmod 600 ~/.ssh/id_rsa`
