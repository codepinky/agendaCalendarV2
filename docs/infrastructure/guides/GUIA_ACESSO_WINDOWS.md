# 🪟 Guia: Acessar Windows do Mac e Rodar Scripts de Provisionamento

Este guia explica como acessar seu Windows desktop pelo terminal do Mac e executar os scripts de provisionamento (Terraform, Ansible, Docker) que normalmente rodariam em uma VM Oracle.

## 🎯 Objetivo

- Acessar o Windows pelo terminal do Mac (via SSH)
- Rodar scripts bash de provisionamento
- Criar ambientes Docker
- Executar Terraform e Ansible

## ✅ Solução Recomendada: WSL2 + SSH

A melhor abordagem é usar **WSL2 (Windows Subsystem for Linux)** no Windows, que fornece um ambiente Linux completo onde você pode rodar todos os scripts bash.

---

## 📋 Passo 1: Instalar WSL2 no Windows

### 1.1. Habilitar WSL2

Abra o PowerShell **como Administrador** no Windows e execute:

```powershell
# Habilitar WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Habilitar Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar o computador
Restart-Computer
```

### 1.2. Instalar WSL2

Após reiniciar, abra o PowerShell como Administrador novamente:

```powershell
# Definir WSL2 como versão padrão
wsl --set-default-version 2

# Instalar Ubuntu (ou outra distribuição Linux)
wsl --install -d Ubuntu-22.04
```

### 1.3. Configurar Ubuntu

Após a instalação, o Ubuntu abrirá automaticamente. Configure:

```bash
# Criar usuário e senha
# (siga as instruções na tela)

# Atualizar sistema
sudo apt update && sudo apt upgrade -y
```

---

## 📋 Passo 2: Instalar Ferramentas no WSL2

Dentro do WSL2 (Ubuntu), instale todas as ferramentas necessárias:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential

# Instalar Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt update
sudo apt install -y terraform

# Instalar Ansible
sudo apt install -y python3-pip
pip3 install ansible

# Instalar Docker (dentro do WSL2)
# Nota: Docker Desktop no Windows pode ser usado, mas é melhor instalar Docker no WSL2
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js (se necessário para o backend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalações
terraform --version
ansible --version
docker --version
docker-compose --version
node --version
```

---

## 📋 Passo 3: Configurar SSH no WSL2

### 3.1. Instalar e Configurar OpenSSH Server

```bash
# Instalar OpenSSH Server
sudo apt install -y openssh-server

# Configurar SSH
sudo nano /etc/ssh/sshd_config
```

**Altere as seguintes linhas no arquivo:**

```
Port 2222                    # Porta diferente da padrão (22) para evitar conflitos
PasswordAuthentication yes   # Permitir login com senha (ou configure chaves SSH)
PermitRootLogin no          # Não permitir login como root
```

### 3.2. Iniciar Serviço SSH

```bash
# Iniciar SSH
sudo service ssh start

# Configurar para iniciar automaticamente
sudo systemctl enable ssh
```

**Nota:** WSL2 não mantém serviços rodando entre reinicializações. Você precisará iniciar o SSH manualmente ou criar um script de inicialização.

### 3.3. Descobrir IP do WSL2

```bash
# Ver IP do WSL2
hostname -I
# ou
ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1
```

**Importante:** O IP do WSL2 muda a cada reinicialização. Você precisará descobrir o IP toda vez ou configurar um IP estático.

---

## 📋 Passo 4: Configurar Port Forwarding no Windows

Para acessar o WSL2 do Mac, você precisa fazer port forwarding no Windows.

### 4.1. Script PowerShell para Port Forwarding

Crie um arquivo `wsl-port-forward.ps1` no Windows:

```powershell
# wsl-port-forward.ps1
$wslIp = (wsl hostname -I).Trim()
netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=2222 connectaddress=$wslIp
Write-Host "Port forwarding configurado: Windows:2222 -> WSL2:$wslIp:2222"
Write-Host "WSL2 IP: $wslIp"
```

Execute como Administrador:

```powershell
# Executar como Administrador
.\wsl-port-forward.ps1
```

### 4.2. Configurar Firewall do Windows

Permitir conexões na porta 2222:

```powershell
# Executar como Administrador
New-NetFirewallRule -DisplayName "WSL2 SSH" -Direction Inbound -LocalPort 2222 -Protocol TCP -Action Allow
```

---

## 📋 Passo 5: Acessar do Mac

### 5.1. Descobrir IP do Windows

No Windows, descubra seu IP local:

```powershell
ipconfig
# Procure por "IPv4 Address" na sua interface de rede
```

### 5.2. Conectar via SSH do Mac

No terminal do Mac:

```bash
# Conectar ao Windows (que redireciona para WSL2)
ssh -p 2222 seu_usuario_wsl@IP_DO_WINDOWS

# Exemplo:
ssh -p 2222 marcos@192.168.1.100
```

**Primeira conexão:** Você verá um aviso sobre fingerprint. Digite `yes`.

---

## 📋 Passo 6: Clonar e Configurar o Projeto

Dentro do WSL2 (via SSH do Mac):

```bash
# Navegar para o diretório do projeto
cd ~

# Clonar o projeto (se ainda não tiver)
git clone <seu-repositorio> AgendaCalendarV2
cd AgendaCalendarV2

# Ou se o projeto já estiver no Windows, acesse via /mnt/c/
cd /mnt/c/Users/marcosraia/Projetos/AgendaCalendarV2

# Dar permissões de execução aos scripts
chmod +x infrastructure/*.sh
chmod +x scripts/**/*.sh
```

---

## 📋 Passo 7: Executar Scripts de Provisionamento

Agora você pode rodar os scripts normalmente:

```bash
# Navegar para a pasta de infraestrutura
cd infrastructure

# Executar deploy completo
bash deploy.sh

# Ou executar scripts individuais
cd terraform
terraform init
terraform plan
terraform apply

cd ../ansible
ansible-playbook playbook.yml
```

---

## 🔄 Alternativa: Script de Inicialização Automática

Para facilitar, crie um script que inicia o SSH e configura o port forwarding automaticamente.

### No Windows (PowerShell como Administrador):

```powershell
# startup-wsl-ssh.ps1
Write-Host "Iniciando WSL2 SSH..."

# Iniciar SSH no WSL2
wsl sudo service ssh start

# Obter IP do WSL2
$wslIp = (wsl hostname -I).Trim()
Write-Host "WSL2 IP: $wslIp"

# Remover regra antiga (se existir)
netsh interface portproxy delete v4tov4 listenport=2222 listenaddress=0.0.0.0 2>$null

# Adicionar nova regra
netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=2222 connectaddress=$wslIp

Write-Host "✅ SSH configurado! Conecte-se com:"
Write-Host "   ssh -p 2222 $env:USERNAME@$(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet' | Select-Object -First 1).IPAddress"
```

Execute este script toda vez que reiniciar o Windows ou o WSL2.

---

## 🎯 Resumo: Fluxo Completo

1. **No Windows:**
   - Instalar WSL2
   - Instalar ferramentas (Terraform, Ansible, Docker) no WSL2
   - Configurar SSH no WSL2
   - Configurar port forwarding

2. **No Mac:**
   ```bash
   ssh -p 2222 usuario@IP_WINDOWS
   ```

3. **Dentro do WSL2 (via SSH):**
   ```bash
   cd /mnt/c/Users/marcosraia/Projetos/AgendaCalendarV2/infrastructure
   bash deploy.sh
   ```

---

## ⚠️ Limitações e Considerações

1. **IP Dinâmico do WSL2:** O IP muda a cada reinicialização. Use o script de port forwarding.

2. **Serviços não persistem:** SSH precisa ser iniciado manualmente após reiniciar WSL2.

3. **Performance:** WSL2 é rápido, mas não é tão rápido quanto uma VM nativa.

4. **Docker:** Você pode usar Docker Desktop do Windows ou Docker dentro do WSL2.

---

## 🔧 Troubleshooting

### Não consigo conectar via SSH

```bash
# Verificar se SSH está rodando no WSL2
wsl sudo service ssh status

# Iniciar SSH
wsl sudo service ssh start

# Verificar porta no Windows
netstat -an | findstr 2222
```

### Port forwarding não funciona

```powershell
# Verificar regras de port forwarding
netsh interface portproxy show all

# Remover e recriar
netsh interface portproxy delete v4tov4 listenport=2222 listenaddress=0.0.0.0
# Depois executar o script novamente
```

### Firewall bloqueando

```powershell
# Verificar regras do firewall
Get-NetFirewallRule | Where-Object DisplayName -like "*WSL*"

# Adicionar regra manualmente
New-NetFirewallRule -DisplayName "WSL2 SSH" -Direction Inbound -LocalPort 2222 -Protocol TCP -Action Allow
```

---

## 📚 Referências

- [WSL2 Documentation](https://docs.microsoft.com/windows/wsl/)
- [SSH no WSL2](https://docs.microsoft.com/windows/wsl/networking)
- [Docker no WSL2](https://docs.docker.com/desktop/wsl/)

---

## ✅ Checklist

- [ ] WSL2 instalado e configurado
- [ ] Terraform instalado no WSL2
- [ ] Ansible instalado no WSL2
- [ ] Docker instalado no WSL2
- [ ] SSH configurado no WSL2
- [ ] Port forwarding configurado no Windows
- [ ] Firewall do Windows configurado
- [ ] Consegue conectar do Mac via SSH
- [ ] Projeto clonado/configurado no WSL2
- [ ] Scripts de provisionamento executando corretamente
