# 🔐 Credenciais Necessárias - AWS

Este documento lista todas as credenciais necessárias para configurar a aplicação na AWS.

## 📋 Checklist de Credenciais AWS

### ✅ 1. AWS Access Key ID e Secret Access Key

**Onde obter:**
1. Acesse: https://console.aws.amazon.com
2. Faça login na sua conta AWS
3. Vá em: **IAM** (Identity and Access Management)
4. Clique em: **Users** (Usuários)
5. Selecione seu usuário (ou crie um novo)
6. Aba: **Security credentials** (Credenciais de segurança)
7. Role até: **Access keys**
8. Clique em: **Create access key**
9. Escolha: **Command Line Interface (CLI)**
10. **IMPORTANTE:** Baixe ou copie as credenciais (Secret Access Key só aparece uma vez!)

**Você precisará de:**
- `AWS_ACCESS_KEY_ID`: Começa com `AKIA...`
- `AWS_SECRET_ACCESS_KEY`: String longa (40+ caracteres)

**Como configurar:**

**Opção 1: AWS CLI (Recomendado)**
```bash
# Instalar AWS CLI (se não tiver)
brew install awscli

# Configurar
aws configure
```

Você será perguntado:
- AWS Access Key ID: `AKIA...`
- AWS Secret Access Key: `sua-secret-key`
- Default region: `us-east-1` (ou `sa-east-1` para São Paulo)
- Default output format: `json`

**Opção 2: Variáveis de Ambiente**
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="sua-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### ✅ 2. Região AWS

Escolha uma região AWS. Recomendações:

- **us-east-1** (N. Virginia) - Mais disponibilidade, recomendado
- **sa-east-1** (São Paulo) - Mais próximo do Brasil
- **us-west-2** (Oregon) - Boa disponibilidade

**Free Tier está disponível em todas as regiões.**

### ✅ 3. Chave SSH Pública

**Se você já tem:**
```bash
# Ver sua chave pública
cat ~/.ssh/id_rsa.pub
```

**Se não tem, criar:**
```bash
# Gerar nova chave SSH
ssh-keygen -t rsa -b 4096 -C "agendacalendar@aws"

# Ver chave pública
cat ~/.ssh/id_rsa.pub
```

**Formato esperado:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@machine
```

## 📝 Configuração no Projeto

### Passo 1: Criar arquivo de configuração Terraform

```bash
cd infrastructure/terraform-aws
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

### Passo 2: Preencher `terraform.tfvars`

```hcl
# Região AWS
aws_region = "us-east-1"  # ou "sa-east-1" para São Paulo

# Chave SSH Pública (conteúdo completo)
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@machine"

# Usuário para Ansible (padrão: ec2-user para Amazon Linux)
ansible_user = "ec2-user"
```

### Passo 3: Configurar credenciais AWS

**Opção A: AWS CLI (Recomendado)**
```bash
aws configure
```

**Opção B: Variáveis de Ambiente**
Adicione ao seu `~/.zshrc` ou `~/.bashrc`:
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="sua-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **Nunca commite:**
   - `terraform.tfvars` (já está no .gitignore)
   - Access Keys
   - Secret Keys
   - Chaves privadas SSH

2. **Permissões IAM:**
   - Crie um usuário IAM específico (não use root)
   - Dê apenas permissões necessárias:
     - `AmazonEC2FullAccess` (ou permissões mais específicas)
     - `AmazonVPCFullAccess` (ou permissões mais específicas)

3. **Rotação de Chaves:**
   - Rotacione as chaves periodicamente
   - Delete chaves antigas não utilizadas

## ✅ Verificação

### Verificar se AWS CLI está configurado:

```bash
aws sts get-caller-identity
```

Deve retornar algo como:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/seu-usuario"
}
```

### Verificar se Terraform consegue acessar AWS:

```bash
cd infrastructure/terraform-aws
terraform init
terraform validate
```

## 📋 Resumo das Credenciais

| Credencial | Onde Obter | Onde Usar |
|------------|------------|-----------|
| **AWS Access Key ID** | IAM > Users > Security credentials | `aws configure` ou variável de ambiente |
| **AWS Secret Access Key** | IAM > Users > Security credentials | `aws configure` ou variável de ambiente |
| **Região AWS** | Escolha (us-east-1 recomendado) | `terraform.tfvars` |
| **Chave SSH Pública** | `cat ~/.ssh/id_rsa.pub` | `terraform.tfvars` |

## 🆘 Problemas Comuns

### "No credentials found"

**Solução:**
```bash
# Configurar AWS CLI
aws configure

# Ou definir variáveis
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### "Access Denied"

**Solução:**
- Verifique se o usuário IAM tem permissões:
  - `AmazonEC2FullAccess`
  - `AmazonVPCFullAccess`
- Ou permissões mais específicas (recomendado)

### "Invalid credentials"

**Solução:**
- Verifique se copiou as credenciais corretamente
- Verifique se não há espaços extras
- Tente criar novas credenciais

## 📚 Próximos Passos

Após configurar as credenciais:

1. ✅ Verificar credenciais: `aws sts get-caller-identity`
2. ✅ Configurar `terraform.tfvars`
3. ✅ Executar deploy: `bash deploy-aws.sh`

Veja `QUICKSTART_AWS.md` para instruções completas de deploy.
