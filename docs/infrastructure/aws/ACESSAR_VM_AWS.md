# 🔌 Como Acessar a VM AWS pelo Terminal do Mac

## 🚀 Acesso Rápido

### Comando SSH Direto

```bash
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

**Ou usando o DNS:**

```bash
ssh -i ~/.ssh/id_rsa ec2-user@ec2-56-125-217-149.sa-east-1.compute.amazonaws.com
```

## 📋 Informações da Conexão

- **Usuário:** `ec2-user` (padrão para Amazon Linux)
- **IP:** `56.125.217.149`
- **DNS:** `ec2-56-125-217-149.sa-east-1.compute.amazonaws.com`
- **Chave SSH:** `~/.ssh/id_rsa` (sua chave privada)
- **Região:** `sa-east-1` (São Paulo)

## 🔧 Configurar SSH para Acesso Fácil

Para não precisar digitar o comando completo toda vez, adicione ao seu `~/.ssh/config`:

```bash
# Editar arquivo de configuração SSH
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

**Depois, você pode conectar simplesmente com:**

```bash
ssh agenda-calendar-aws
```

## ✅ Verificar Conexão

### Testar se consegue conectar:

```bash
# Teste rápido
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149 "echo 'Conexão OK!'"
```

### Se funcionar, você verá:
```
Conexão OK!
```

## 🆘 Problemas Comuns

### Erro: "Permission denied (publickey)"

**Solução:**
```bash
# Verificar permissões da chave privada
chmod 600 ~/.ssh/id_rsa

# Tentar novamente
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

### Erro: "Host key verification failed"

**Solução:**
```bash
# Remover entrada antiga do known_hosts
ssh-keygen -R 56.125.217.149

# Tentar novamente
ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149
```

### Erro: "Connection timed out"

**Possíveis causas:**
1. Security Group não permite SSH (porta 22)
2. VM não está rodando
3. IP mudou

**Verificar:**
```bash
# Verificar se VM está rodando
aws ec2 describe-instances --instance-ids i-0443fa9bc059caeb3 --region sa-east-1 --query 'Reservations[*].Instances[*].[State.Name,PublicIpAddress]' --output table

# Verificar Security Group
aws ec2 describe-security-groups --group-names agenda-calendar-sg --region sa-east-1
```

## 📝 Comandos Úteis Após Conectar

### Ver informações do sistema:

```bash
# Informações do sistema
uname -a

# Espaço em disco
df -h

# Memória
free -h

# Processos
top
```

### Verificar instalações:

```bash
# Docker
docker --version
docker ps

# Node.js
node --version
npm --version

# Docker Compose
docker-compose --version
```

## 🔄 Sair da VM

```bash
# Simplesmente digite:
exit

# Ou pressione: Ctrl+D
```

## 📚 Próximos Passos

Após conectar na VM:

1. ✅ Verificar se Docker está instalado
2. ✅ Verificar se Node.js está instalado
3. ✅ Executar provisionamento com Ansible (se ainda não foi feito)
4. ✅ Configurar backend e N8N

## 💡 Dica: Script de Acesso Rápido

Crie um alias no seu `~/.zshrc` ou `~/.bashrc`:

```bash
# Adicionar ao final do arquivo
alias aws-vm='ssh -i ~/.ssh/id_rsa ec2-user@56.125.217.149'
```

**Depois:**
```bash
# Recarregar configuração
source ~/.zshrc  # ou source ~/.bashrc

# Conectar facilmente
aws-vm
```
