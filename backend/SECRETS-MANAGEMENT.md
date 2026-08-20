# Secrets Management

## Overview

This document explains how to securely manage secrets for the GatherGrove backend application.

## ⚠️ SECURITY WARNING

**NEVER commit secrets to source control!**

All sensitive values (API keys, connection strings, passwords) must be stored securely using one of the methods below.

## Development Environment

### Option 1: Environment Variables (Recommended)

1. Copy `.env.example` to `.env` in the backend directory
2. Fill in your actual secret values
3. The application will read from environment variables automatically

```bash
# Linux/Mac
export JWT_SECRET_KEY="your-secret-key"
export STRIPE_SECRET_KEY="sk_test_..."

# Windows PowerShell
$env:JWT_SECRET_KEY="your-secret-key"
$env:STRIPE_SECRET_KEY="sk_test_..."
```

### Option 2: .NET User Secrets (Local Development)

For local development, use .NET User Secrets which stores secrets outside the project directory:

```bash
cd backend/src/GatherGrove.API

# Set individual secrets
dotnet user-secrets set "JwtSettings:SecretKey" "your-secret-key"
dotnet user-secrets set "Stripe:SecretKey" "sk_test_..."
dotnet user-secrets set "Stripe:PublishableKey" "pk_test_..."
dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."

# List all secrets
dotnet user-secrets list

# Clear all secrets
dotnet user-secrets clear
```

## Production Environment

### Azure Key Vault (Production)

For production deployments, use Azure Key Vault:

1. Create an Azure Key Vault instance
2. Add secrets to Key Vault
3. Reference secrets in `appsettings.Production.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/JWT-SecretKey/)"
  },
  "Stripe": {
    "SecretKey": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/Stripe-SecretKey/)"
  }
}
```

4. Configure Managed Identity or Service Principal for Key Vault access

## Required Secrets

### JWT Settings
- `JWT_SECRET_KEY` - Secret key for signing JWT tokens (minimum 32 characters)

### Stripe
- `STRIPE_SECRET_KEY` - Stripe secret API key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)

### Azure Storage (Optional)
- `AZURE_STORAGE_CONNECTION_STRING` - Connection string for Azure Blob Storage
  - Leave empty to use mock storage in development

## Secret Rotation

### When to Rotate Secrets

Rotate secrets immediately if:
- Secrets are accidentally committed to source control
- A team member with access leaves
- There's a suspected security breach
- As part of regular security maintenance (recommended: every 90 days)

### How to Rotate Secrets

1. **Generate new secret** in the service provider (Stripe, Azure, etc.)
2. **Update Key Vault or environment variables** with new value
3. **Deploy updated configuration** to all environments
4. **Verify application works** with new secrets
5. **Revoke old secret** in the service provider

## Troubleshooting

### Application fails to start with "Secret key not configured"

1. Verify environment variables are set correctly
2. Check user-secrets with `dotnet user-secrets list`
3. Ensure Key Vault access is configured for production

### Stripe webhook signature verification fails

1. Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint in Stripe Dashboard
2. Each webhook endpoint has a unique signing secret
3. Re-generate webhook secret if needed and update configuration

## Best Practices

✅ **DO:**
- Use environment variables or User Secrets for local development
- Use Azure Key Vault for production
- Rotate secrets regularly
- Use different secrets for each environment (dev, staging, production)
- Audit Key Vault access logs

❌ **DON'T:**
- Commit secrets to source control
- Share secrets via email or chat
- Use the same secrets across environments
- Store secrets in plain text files
- Log secret values

## Git Safety

The following files are in `.gitignore` to prevent secret exposure:
- `.env`
- `appsettings.Development.json` (contains empty placeholders only)
- User secrets are stored outside the project directory automatically

If you accidentally commit secrets:
1. Revoke/rotate ALL exposed secrets immediately
2. Remove from Git history using `git filter-branch` or BFG Repo-Cleaner
3. Force push the cleaned history
4. Notify security team

## Support

For questions about secrets management, contact the security team or refer to:
- [ASP.NET Core Configuration](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)
- [.NET User Secrets](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
