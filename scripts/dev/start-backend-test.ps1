$env:ASPNETCORE_ENVIRONMENT = "Test"
Set-Location (Join-Path $PSScriptRoot "..\..\backend\src\GatherGrove.API")
dotnet run --urls "http://0.0.0.0:8050" --no-launch-profile
