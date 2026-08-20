$env:USE_INMEMORY_DB = "true"
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:JWT_SECRET_KEY = "GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location (Join-Path $repoRoot "backend/src/GatherGrove.API")
dotnet run --urls "http://0.0.0.0:8050" --no-launch-profile
