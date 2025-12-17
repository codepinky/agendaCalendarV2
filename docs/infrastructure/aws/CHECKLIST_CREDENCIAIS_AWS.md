# ✅ Checklist de Credenciais - AWS

## Credenciais Necessárias para AWS

### 🔑 AWS Access Keys

- [ ] **AWS Access Key ID** criada
  - Onde: IAM > Users > Security credentials > Create access key
  - Formato: `AKIA...`
  - Status: ⬜ Não configurado / ✅ Configurado

- [ ] **AWS Secret Access Key** salva
  - Onde: Mesmo lugar (só aparece uma vez!)
  - Formato: String longa (40+ caracteres)
  - Status: ⬜ Não configurado / ✅ Configurado

- [ ] **Credenciais configuradas**
  - Via AWS CLI: `aws configure` ✅
  - Ou variáveis de ambiente: `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` ✅
  - Status: ⬜ Não configurado / ✅ Configurado

### 🌍 Região AWS

- [ ] **Região selecionada**
  - Escolhida: `_________________`
  - Opções: `us-east-1` (recomendado) ou `sa-east-1` (São Paulo)
  - Status: ⬜ Não selecionada / ✅ Selecionada

### 🔐 Chave SSH

- [ ] **Chave SSH pública gerada**
  - Comando: `cat ~/.ssh/id_rsa.pub`
  - Formato: `ssh-rsa AAAAB3NzaC1yc2E... user@machine`
  - Status: ⬜ Não gerada / ✅ Gerada

- [ ] **Chave SSH adicionada ao terraform.tfvars**
  - Arquivo: `infrastructure/terraform-aws/terraform.tfvars`
  - Status: ⬜ Não adicionada / ✅ Adicionada

### 📝 Configuração Terraform

- [ ] **Arquivo terraform.tfvars criado**
  - Local: `infrastructure/terraform-aws/terraform.tfvars`
  - Copiado de: `terraform.tfvars.example`
  - Status: ⬜ Não criado / ✅ Criado

- [ ] **terraform.tfvars preenchido**
  - `aws_region`: ✅
  - `ssh_public_key`: ✅
  - `ansible_user`: ✅ (padrão: ec2-user)
  - Status: ⬜ Não preenchido / ✅ Preenchido

## ✅ Verificação Final

### Testar Credenciais AWS

```bash
# Verificar se AWS CLI está configurado
aws sts get-caller-identity
```

- [ ] Comando executado com sucesso
- [ ] Retornou Account ID e User ARN
- [ ] Status: ⬜ Falhou / ✅ Sucesso

### Testar Terraform

```bash
cd infrastructure/terraform-aws
terraform init
terraform validate
```

- [ ] Terraform inicializado
- [ ] Configuração validada
- [ ] Status: ⬜ Falhou / ✅ Sucesso

## 📋 Resumo

| Item | Status | Notas |
|------|--------|-------|
| AWS Access Key ID | ⬜ | |
| AWS Secret Access Key | ⬜ | |
| Credenciais configuradas | ⬜ | AWS CLI ou variáveis |
| Região selecionada | ⬜ | |
| Chave SSH gerada | ⬜ | |
| terraform.tfvars criado | ⬜ | |
| terraform.tfvars preenchido | ⬜ | |
| Credenciais testadas | ⬜ | |

## 🚀 Próximo Passo

Quando todos os itens estiverem marcados:

```bash
cd infrastructure
bash deploy-aws.sh
```

## 📚 Documentação

- **Guia Completo**: `CREDENCIAIS_AWS.md`
- **Quick Start**: `QUICKSTART_AWS.md`
- **Guia Detalhado**: `GUIA_AWS_FREE_TIER.md`
