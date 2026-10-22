$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $basedir
& node "$basedir\run.mjs" $args
