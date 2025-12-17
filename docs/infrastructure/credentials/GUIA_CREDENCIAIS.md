# 🔐 Guia Completo: Onde Obter Cada Credencial

Guia passo a passo para obter todas as credenciais necessárias para criar a VM na Oracle Cloud Free Tier.

## 📋 Checklist de Credenciais

Você precisa de:
- [ ] Tenancy OCID
- [ ] User OCID  
- [ ] Compartment OCID
- [ ] API Key (fingerprint + chave privada)
- [ ] Chave SSH (pública e privada)
- [ ] Região OCI

---

## 1️⃣ Tenancy OCID

**Onde obter:**
1. Acesse: https://cloud.oracle.com
2. Faça login na sua conta Oracle Cloud
3. No canto superior direito, clique no **menu de usuário** (ícone de pessoa)
4. Selecione **"Tenancy"**
5. Na página que abre, você verá **"OCID"** - copie este valor
   - Formato: `ocid1.tenancy.oc1..aaaaaaaa...`

**Exemplo:** `ocid1.tenancy.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 2️⃣ User OCID

**Onde obter:**
1. No OCI Console, vá em **Identity** > **Users**
2. Clique no seu usuário
3. Na página de detalhes, você verá **"OCID"** - copie este valor
   - Formato: `ocid1.user.oc1..aaaaaaaa...`

**Exemplo:** `ocid1.user.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 3️⃣ Compartment OCID

**Onde obter:**
1. No OCI Console, vá em **Identity** > **Compartments**
2. Você verá uma lista de compartments
3. Clique no compartment que deseja usar (geralmente o root ou um que você criou)
4. Na página de detalhes, copie o **"OCID"**
   - Formato: `ocid1.compartment.oc1..aaaaaaaa...`

**Dica:** Se não tiver um compartment específico, use o root compartment (tenancy OCID).

**Exemplo:** `ocid1.compartment.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 4️⃣ API Key (Fingerprint + Chave Privada)

**Onde obter:**
1. No OCI Console, vá em **Identity** > **Users**
2. Clique no seu usuário
3. No menu lateral, clique em **"API Keys"**
4. Clique em **"Add API Key"**
5. Selecione **"Paste Public Key"** ou **"Generate Key Pair"**

### Opção A: Gerar par de chaves (Recomendado)
1. Selecione **"Generate Key Pair"**
2. Clique em **"Download Private Key"** - **IMPORTANTE:** Salve este arquivo!
3. Clique em **"Download Public Key"** (opcional, não precisamos)
4. Clique em **"Add"**
5. **Copie o fingerprint** que aparece (formato: `xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx`)

### Opção B: Usar chave existente
1. Se você já tem uma chave SSH, use a pública dela
2. Cole no campo e clique em **"Add"**

**O que você precisa:**
- **Fingerprint:** Copie da tela (aparece após adicionar)
- **Chave Privada:** O arquivo `.pem` que você baixou

**Exemplo de fingerprint:** `12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef`

**Onde salvar a chave privada:**
```bash
# Criar diretório
mkdir -p ~/.oci

# Mover o arquivo baixado
mv ~/Downloads/oci_api_key_*.pem ~/.oci/oci_api_key.pem

# Dar permissões corretas
chmod 600 ~/.oci/oci_api_key.pem
```

---

## 5️⃣ Chave SSH (Para acessar a VM)

**Gerar chave SSH:**

### macOS/Linux:
```bash
# Gerar chave SSH (se ainda não tiver)
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Quando perguntar onde salvar, pressione Enter (usa padrão: ~/.ssh/id_rsa)
# Quando perguntar senha, pode deixar vazio ou criar uma

# Ver chave pública (você vai copiar isso para o terraform.tfvars)
cat ~/.ssh/id_rsa.pub
```

### Windows (PowerShell):
```powershell
# Gerar chave SSH
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Ver chave pública
Get-Content ~/.ssh/id_rsa.pub
```

**O que você precisa:**
- **Chave Pública:** Todo o conteúdo do arquivo `~/.ssh/id_rsa.pub`
  - Formato: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... seu-email@exemplo.com`

**Exemplo completo:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ seu-email@exemplo.com
```

---

## 6️⃣ Região OCI

**Onde ver:**
1. No OCI Console, no canto superior direito, você verá a região atual
2. Clique para ver todas as regiões disponíveis

**Regiões recomendadas (Free Tier disponível):**
- `us-ashburn-1` (EUA - Leste)
- `us-phoenix-1` (EUA - Oeste)
- `sa-saopaulo-1` (Brasil - São Paulo) ⭐ Recomendado para Brasil
- `eu-frankfurt-1` (Europa)
- `uk-london-1` (Reino Unido)

**Exemplo:** `sa-saopaulo-1` (para Brasil)

---

## ✅ Verificação: Free Tier

**Confirmação de que está configurado para Free Tier:**

O Terraform está configurado com:
- **Shape:** `VM.Standard.A1.Flex` ✅ (Esta é a VM Always Free ARM)
- **OCPUs:** 1 (dentro do limite free: até 4 OCPUs)
- **Memory:** 6 GB (dentro do limite free: até 24 GB)

**Limites do Free Tier:**
- ✅ 2 VMs Always Free (ARM)
- ✅ Até 4 OCPUs totais
- ✅ Até 24 GB de memória total
- ✅ 10 TB de egress de dados por mês

**Nossa configuração usa:**
- 1 VM
- 1 OCPU
- 6 GB RAM

✅ **Está dentro do Free Tier!**

---

## 📝 Preencher terraform.tfvars

Após obter todas as credenciais, preencha o arquivo:

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

**Exemplo completo:**
```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
user_ocid        = "ocid1.user.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
fingerprint      = "12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef"
private_key_path = "~/.oci/oci_api_key.pem"
region           = "sa-saopaulo-1"
compartment_id   = "ocid1.compartment.oc1..aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ssh_public_key   = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC... seu-email@exemplo.com"
ansible_user     = "opc"
```

---

## 🆘 Problemas Comuns

### "Invalid API key"
- Verifique se o fingerprint está correto
- Verifique se a chave privada está no caminho correto
- Verifique as permissões: `chmod 600 ~/.oci/oci_api_key.pem`

### "Compartment not found"
- Use o tenancy OCID como compartment_id se não tiver compartments
- Verifique se copiou o OCID completo

### "SSH connection failed"
- Verifique se a chave pública está correta no terraform.tfvars
- Verifique se copiou a chave completa (começa com `ssh-rsa`)

---

## 📚 Links Úteis

- **OCI Console:** https://cloud.oracle.com
- **Documentação OCI:** https://docs.oracle.com/en-us/iaas/Content/home.htm
- **Free Tier:** https://www.oracle.com/cloud/free/

