$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ShortcutPath = Join-Path ([Environment]::GetFolderPath('Desktop')) 'YouTube Downloader.lnk'
$TargetPath = Join-Path $Root 'desktop\YouTube Downloader.cmd'
$IconPath = Join-Path $Root 'desktop\app-icon.ico'

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $Root
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = 'YouTube Downloader'
$Shortcut.Save()

Write-Host "Shortcut created: $ShortcutPath"
