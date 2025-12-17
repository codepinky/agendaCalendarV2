# 🪟 Scripts para Windows

Scripts auxiliares para configurar o acesso ao Windows via SSH do Mac.

## 📋 Scripts Disponíveis

### `setup-wsl-ssh.ps1`

Script PowerShell que configura automaticamente:
- Inicia SSH no WSL2
- Configura port forwarding (Windows:2222 -> WSL2:2222)
- Configura firewall do Windows
- Mostra informações de conexão

**Uso:**
```powershell
# Executar como Administrador
.\setup-wsl-ssh.ps1
```

## 🚀 Uso Rápido

1. **No Windows (PowerShell como Administrador):**
   ```powershell
   cd C:\Users\marcosraia\Projetos\AgendaCalendarV2\infrastructure\scripts-windows
   .\setup-wsl-ssh.ps1
   ```

2. **No Mac:**
   ```bash
   ssh -p 2222 usuario@IP_DO_WINDOWS
   ```

## ⚠️ Importante

Execute `setup-wsl-ssh.ps1` toda vez que:
- Reiniciar o Windows
- Reiniciar o WSL2
- O SSH parar de funcionar

## 🔧 Configuração Permanente (Opcional)

Para executar automaticamente na inicialização do Windows:

1. Abra o Agendador de Tarefas do Windows
2. Criar Tarefa Básica
3. Nome: "Iniciar WSL2 SSH"
4. Gatilho: "Quando o computador iniciar"
5. Ação: "Iniciar um programa"
6. Programa: `powershell.exe`
7. Argumentos: `-ExecutionPolicy Bypass -File "C:\caminho\para\setup-wsl-ssh.ps1"`
