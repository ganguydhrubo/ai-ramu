$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $basedir
& "$basedir\run-all.ps1"
