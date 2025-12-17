# 📦 Instalar Pré-requisitos

## macOS - Instalação Rápida

### 1. Instalar Homebrew (se não tiver)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar Terraform

```bash
brew install terraform
```

### 3. Instalar Ansible

```bash
brew install ansible
```

### 4. Verificar Instalação

```bash
terraform --version
ansible --version
```

---

## Instalação Manual (Alternativa)

### Terraform

```bash
# Baixar Terraform
cd /tmp
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_darwin_amd64.zip

# Extrair
unzip terraform_1.6.0_darwin_amd64.zip

# Mover para /usr/local/bin
sudo mv terraform /usr/local/bin/

# Verificar
terraform --version
```

### Ansible

```bash
# Instalar via pip
pip3 install ansible

# Ou via pipx (recomendado)
pip3 install --user pipx
pipx ensurepath
pipx install ansible
```

---

## Verificação Completa

Execute este comando para verificar tudo:

```bash
echo "=== Verificando Pré-requisitos ==="
echo ""
echo "Terraform:"
terraform --version 2>/dev/null || echo "❌ Terraform não instalado"
echo ""
echo "Ansible:"
ansible --version 2>/dev/null || echo "❌ Ansible não instalado"
echo ""
echo "Python 3:"
python3 --version 2>/dev/null || echo "❌ Python 3 não instalado"
echo ""
echo "Chave OCI:"
ls -la ~/.oci/oci_api_key.pem 2>/dev/null && echo "✅ Chave OCI encontrada" || echo "❌ Chave OCI não encontrada"
```

---

## Após Instalar

Execute novamente:

```bash
cd infrastructure
bash deploy.sh
```

