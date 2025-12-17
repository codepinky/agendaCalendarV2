# 📝 Resumo: Acessar Windows do Mac para Rodar Scripts

## ✅ Sim, é possível!

Você pode acessar seu Windows desktop pelo terminal do Mac e rodar todos os scripts de provisionamento, **exatamente como faria com uma VM na Oracle**.

## 🎯 Solução: WSL2 + SSH

A melhor forma é usar **WSL2 (Windows Subsystem for Linux)** no Windows, que cria um ambiente Linux completo onde você pode rodar todos os scripts bash.

## 🚀 Passos Rápidos

### 1. No Windows: Instalar WSL2

```powershell
# PowerShell como Administrador
wsl --install -d Ubuntu-22.04
```

### 2. No WSL2: Instalar Ferramentas

```bash
# Dentro do WSL2 (Ubuntu)
sudo apt update && sudo apt upgrade -y
sudo apt install -y openssh-server terraform python3-pip docker.io docker-compose
pip3 install ansible
```

### 3. No Windows: Configurar SSH e Port Forwarding

```powershell
# PowerShell como Administrador
cd C:\Users\marcosraia\Projetos\AgendaCalendarV2\infrastructure\scripts-windows
.\setup-wsl-ssh.ps1
```

Este script faz tudo automaticamente:
- ✅ Inicia SSH no WSL2
- ✅ Configura port forwarding
- ✅ Configura firewall
- ✅ Mostra como conectar

### 4. No Mac: Conectar

```bash
# Descobrir IP do Windows (no Windows: ipconfig)
ssh -p 2222 usuario@IP_DO_WINDOWS
```

### 5. Rodar Scripts

Dentro do WSL2 (via SSH do Mac):

```bash
cd /mnt/c/Users/marcosraia/Projetos/AgendaCalendarV2/infrastructure
bash deploy.sh
```

## 📋 Comparação: VM Oracle vs Windows/WSL2

| Aspecto | VM Oracle | Windows/WSL2 |
|---------|-----------|--------------|
| Acesso SSH | ✅ Sim | ✅ Sim (via port forwarding) |
| Rodar scripts bash | ✅ Sim | ✅ Sim (ambiente Linux completo) |
| Terraform | ✅ Sim | ✅ Sim |
| Ansible | ✅ Sim | ✅ Sim |
| Docker | ✅ Sim | ✅ Sim |
| Performance | ⚡ Muito boa | ⚡ Boa |
| Custo | 💰 Gratuito (Free Tier) | 💰 Gratuito (já tem Windows) |

## ⚠️ Diferenças Importantes

1. **IP Dinâmico:** O IP do WSL2 muda a cada reinicialização. Execute `setup-wsl-ssh.ps1` novamente.

2. **SSH Manual:** O SSH precisa ser iniciado manualmente após reiniciar o WSL2.

3. **Port Forwarding:** Precisa ser configurado no Windows para acessar do Mac.

## 🔄 Fluxo Completo

```
Mac Terminal
    ↓ (SSH na porta 2222)
Windows (port forwarding)
    ↓ (redireciona para porta 2222)
WSL2 (Ubuntu Linux)
    ↓ (executa scripts)
Terraform + Ansible + Docker
```

## 📚 Documentação Completa

Veja `GUIA_ACESSO_WINDOWS.md` para instruções detalhadas passo a passo.

## ✅ Checklist Rápido

- [ ] WSL2 instalado no Windows
- [ ] Ferramentas instaladas no WSL2 (Terraform, Ansible, Docker)
- [ ] SSH configurado no WSL2
- [ ] Script `setup-wsl-ssh.ps1` executado no Windows
- [ ] Consegue conectar do Mac via SSH
- [ ] Scripts de provisionamento funcionando

## 🆘 Problemas Comuns

**Não consigo conectar:**
- Execute `setup-wsl-ssh.ps1` novamente no Windows
- Verifique se o Windows e Mac estão na mesma rede
- Verifique firewall do Windows

**SSH não inicia:**
- No WSL2: `sudo service ssh start`
- Verifique se OpenSSH Server está instalado: `sudo apt install openssh-server`

**Port forwarding não funciona:**
- Execute `setup-wsl-ssh.ps1` como Administrador
- Verifique regras: `netsh interface portproxy show all`
