$ErrorActionPreference = 'Stop'

Set-Location (Join-Path $PSScriptRoot '..')

docker compose ps

Write-Host "`n--- Últimos logs de postgres ---"
docker compose logs --tail=80 postgres
