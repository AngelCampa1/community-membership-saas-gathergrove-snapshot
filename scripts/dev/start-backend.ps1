$env:USE_INMEMORY_DB = "true"
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:JWT_SECRET_KEY = "GatherGrove-Test-Secret-Key-For-JWT-Token-Generation-2024-Testing-Environment-Secure"
Set-Location (Join-Path $PSScriptRoot "..\..\backend")
dotnet run --project src/GatherGrove.API --urls "http://0.0.0.0:8050" --no-launch-profile
