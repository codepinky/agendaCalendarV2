# 🔑 Instruções: Chave Privada da API Key

## ⚠️ Importante

Você forneceu o **fingerprint** da API Key, mas também precisa do **arquivo da chave privada** (.pem).

## 📋 Como Obter a Chave Privada

### Opção 1: Se você já baixou antes

1. Procure o arquivo `.pem` que você baixou quando criou a API Key
2. Mova para o local correto:
   ```bash
   mkdir -p ~/.oci
   mv ~/Downloads/oci_api_key_*.pem ~/.oci/oci_api_key.pem
   chmod 600 ~/.oci/oci_api_key.pem
   ```

### Opção 2: Se você NÃO tem o arquivo

**Você precisa criar uma NOVA API Key** (a antiga não tem como recuperar a chave privada):

1. **Acesse OCI Console:**
   - https://cloud.oracle.com
   - Identity > Users > Seu usuário > API Keys

2. **Criar nova API Key:**
   - Clique em "Add API Key"
   - Selecione **"Generate Key Pair"** (IMPORTANTE!)
   - Clique em "Download Private Key" - **SALVE ESTE ARQUIVO!**
   - Clique em "Add"

3. **Salvar a chave:**
   ```bash
   mkdir -p ~/.oci
   # Mover o arquivo baixado para ~/.oci
   mv ~/Downloads/oci_api_key_*.pem ~/.oci/oci_api_key.pem
   chmod 600 ~/.oci/oci_api_key.pem
   ```

4. **Atualizar fingerprint no terraform.tfvars:**
   - Copie o novo fingerprint que aparece na tela
   - Atualize o arquivo `infrastructure/terraform/terraform.tfvars`

## ✅ Verificar se está correto

```bash
# Verificar se o arquivo existe
ls -la ~/.oci/oci_api_key.pem

# Deve mostrar algo como:
# -rw-------  1 user  staff  1675 Dec 10 10:00 /Users/user/.oci/oci_api_key.pem
```

**Importante:** As permissões devem ser `600` (apenas você pode ler/escrever).

## 🔍 Verificar conteúdo do arquivo

O arquivo deve começar com:
```
-----BEGIN RSA PRIVATE KEY-----
```
ou
```
-----BEGIN PRIVATE KEY-----
```

## ⚠️ Segurança

- **NUNCA** commite este arquivo no Git
- **NUNCA** compartilhe este arquivo
- Mantenha backup seguro
- Use permissões 600

## ✅ Após configurar

Quando o arquivo estiver em `~/.oci/oci_api_key.pem` com permissões corretas, você pode executar:

```bash
cd infrastructure
bash deploy.sh
```





