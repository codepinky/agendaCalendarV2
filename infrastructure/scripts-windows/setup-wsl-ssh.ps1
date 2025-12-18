# Script PowerShell para configurar WSL2 SSH e Port Forwarding
# Execute como Administrador: .\setup-wsl-ssh.ps1

Write-Host "🚀 Configurando WSL2 SSH e Port Forwarding..." -ForegroundColor Cyan

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botão direito > Executar como Administrador" -ForegroundColor Yellow
    exit 1
}

# Verificar se WSL está instalado
Write-Host "`n📋 Verificando WSL..." -ForegroundColor Cyan
$wslInstalled = wsl --list --quiet 2>$null
if (-not $wslInstalled) {
    Write-Host "❌ WSL não está instalado!" -ForegroundColor Red
    Write-Host "   Execute: wsl --install" -ForegroundColor Yellow
    exit 1
}

# Obter distribuição WSL padrão
$wslDistro = (wsl --list --quiet | Select-Object -First 1).Trim()
Write-Host "✅ WSL encontrado: $wslDistro" -ForegroundColor Green

# Iniciar SSH no WSL2
Write-Host "`n🔧 Iniciando SSH no WSL2..." -ForegroundColor Cyan
wsl -d $wslDistro sudo service ssh start
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH iniciado no WSL2" -ForegroundColor Green
} else {
    Write-Host "⚠️  SSH pode não estar instalado no WSL2" -ForegroundColor Yellow
    Write-Host "   Execute no WSL2: sudo apt install openssh-server" -ForegroundColor Yellow
}

# Obter IP do WSL2
Write-Host "`n🌐 Obtendo IP do WSL2..." -ForegroundColor Cyan
$wslIp = (wsl -d $wslDistro hostname -I).Trim()
if ([string]::IsNullOrWhiteSpace($wslIp)) {
    Write-Host "❌ Não foi possível obter IP do WSL2" -ForegroundColor Red
    exit 1
}
Write-Host "✅ WSL2 IP: $wslIp" -ForegroundColor Green

# Obter IP do Windows
$windowsIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.InterfaceAlias -notlike "*vEthernet*WSL*"
} | Select-Object -First 1).IPAddress

if ([string]::IsNullOrWhiteSpace($windowsIp)) {
    $windowsIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" -ErrorAction SilentlyContinue).IPAddress
    if ([string]::IsNullOrWhiteSpace($windowsIp)) {
        $windowsIp = "SEU_IP_AQUI"
    }
}

Write-Host "✅ Windows IP: $windowsIp" -ForegroundColor Green

# Remover regra antiga de port forwarding (se existir)
Write-Host "`n🔧 Configurando Port Forwarding..." -ForegroundColor Cyan
netsh interface portproxy delete v4tov4 listenport=2222 listenaddress=0.0.0.0 2>$null

# Adicionar nova regra
netsh interface portproxy add v4tov4 listenport=2222 listenaddress=0.0.0.0 connectport=2222 connectaddress=$wslIp
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Port forwarding configurado: Windows:2222 -> WSL2:$wslIp:2222" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao configurar port forwarding" -ForegroundColor Red
    exit 1
}

# Configurar Firewall
Write-Host "`n🔥 Configurando Firewall..." -ForegroundColor Cyan
$firewallRule = Get-NetFirewallRule -DisplayName "WSL2 SSH" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "WSL2 SSH" -Direction Inbound -LocalPort 2222 -Protocol TCP -Action Allow | Out-Null
    Write-Host "✅ Regra de firewall criada" -ForegroundColor Green
} else {
    Write-Host "✅ Regra de firewall já existe" -ForegroundColor Green
}

# Obter usuário do WSL2
$wslUser = (wsl -d $wslDistro whoami).Trim()

# Mostrar informações de conexão
Write-Host "`n" -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Informações de Conexão:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Do Mac, execute:" -ForegroundColor White
Write-Host "   ssh -p 2222 $wslUser@$windowsIp" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Ou adicione ao ~/.ssh/config no Mac:" -ForegroundColor White
Write-Host "   Host windows-wsl" -ForegroundColor Cyan
Write-Host "       HostName $windowsIp" -ForegroundColor Cyan
Write-Host "       Port 2222" -ForegroundColor Cyan
Write-Host "       User $wslUser" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Depois: ssh windows-wsl" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Execute este script toda vez que reiniciar o Windows" -ForegroundColor White
Write-Host "   - O IP do WSL2 muda a cada reinicialização" -ForegroundColor White
Write-Host "   - O SSH precisa ser iniciado manualmente no WSL2" -ForegroundColor White
Write-Host ""




