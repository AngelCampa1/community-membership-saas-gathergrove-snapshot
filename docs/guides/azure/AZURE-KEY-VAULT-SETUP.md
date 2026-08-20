# Azure Key Vault Setup Guide for GatherGrove

## Overview

This guide explains how to set up Azure Key Vault for secure secrets management in production and staging environments. Azure Key Vault provides centralized secrets management with access control, audit logging, and automatic secret rotation.

## Prerequisites

- Azure subscription with appropriate permissions
- Azure CLI installed (`az --version` to verify)
- PowerShell or Bash terminal
- Owner or Contributor role on Azure subscription

---

## Step 1: Create Azure Key Vault

### Using Azure Portal

1. **Navigate to Key Vaults**
   - Go to [Azure Portal](https://portal.azure.com)
   - Search for "Key vaults" and select it

2. **Create New Key Vault**
   - Click "Create"
   - Select your subscription and resource group
   - **Key vault name**: `gathergrove-kv-{environment}` (e.g., `gathergrove-kv-prod`)
   - **Region**: Same as your App Service (e.g., East US)
   - **Pricing tier**: Standard (Premium if you need HSM-backed keys)

3. **Configure Access Policy**
   - Go to "Access policies"
   - Click "Add Access Policy"
   - **Secret permissions**: Get, List
   - **Select principal**: Your App Service managed identity
   - Save

### Using Azure CLI

```bash
# Variables
RESOURCE_GROUP="gathergrove-prod-rg"
KEY_VAULT_NAME="gathergrove-kv-prod"
LOCATION="eastus"
APP_SERVICE_NAME="gathergrove-api-prod"

# Create Key Vault
az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku standard

# Enable soft delete and purge protection (recommended for production)
az keyvault update \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --enable-soft-delete true \
  --enable-purge-protection true

# Enable managed identity for App Service
az webapp identity assign \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP

# Get the managed identity principal ID
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Grant App Service access to Key Vault
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

---

## Step 2: Generate and Store Secrets

### Generate Secure Secrets

#### PowerShell Script

```powershell
# Generate JWT Secret (256-bit / 32 bytes)
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "JWT Secret: $jwtSecret"

# Generate CSRF Secret (256-bit / 32 bytes)
$csrfSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "CSRF Secret: $csrfSecret"

# Generate Encryption Master Key (256-bit / 32 bytes)
$encryptionKey = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "Encryption Master Key: $encryptionKey"

# Generate Encryption IV (128-bit / 16 bytes)
$encryptionIV = [Convert]::ToBase64String((1..16 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "Encryption IV: $encryptionIV"

# Save to a secure file (DO NOT commit to source control!)
@{
    JwtSecret = $jwtSecret
    CsrfSecret = $csrfSecret
    EncryptionKey = $encryptionKey
    EncryptionIV = $encryptionIV
} | ConvertTo-Json | Out-File "secrets-backup-$(Get-Date -Format 'yyyy-MM-dd').json"

Write-Host "`nSecrets saved to: secrets-backup-$(Get-Date -Format 'yyyy-MM-dd').json"
Write-Host "IMPORTANT: Store this file in a secure location and delete from your local machine!"
```

#### Bash Script

```bash
#!/bin/bash

# Generate JWT Secret (256-bit / 32 bytes)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT Secret: $JWT_SECRET"

# Generate CSRF Secret (256-bit / 32 bytes)
CSRF_SECRET=$(openssl rand -base64 32)
echo "CSRF Secret: $CSRF_SECRET"

# Generate Encryption Master Key (256-bit / 32 bytes)
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "Encryption Master Key: $ENCRYPTION_KEY"

# Generate Encryption IV (128-bit / 16 bytes)
ENCRYPTION_IV=$(openssl rand -base64 16)
echo "Encryption IV: $ENCRYPTION_IV"

# Save to a secure file (DO NOT commit to source control!)
cat > "secrets-backup-$(date +%Y-%m-%d).json" <<EOF
{
  "JwtSecret": "$JWT_SECRET",
  "CsrfSecret": "$CSRF_SECRET",
  "EncryptionKey": "$ENCRYPTION_KEY",
  "EncryptionIV": "$ENCRYPTION_IV"
}
EOF

echo ""
echo "Secrets saved to: secrets-backup-$(date +%Y-%m-%d).json"
echo "IMPORTANT: Store this file in a secure location and delete from your local machine!"
```

### Store Secrets in Key Vault

#### Using Azure Portal

1. **Navigate to your Key Vault**
2. **Go to "Secrets" section**
3. **Click "Generate/Import"**
4. For each secret:
   - **Upload options**: Manual
   - **Name**: (use names from table below)
   - **Value**: (paste generated secret)
   - **Enabled**: Yes
   - Click "Create"

#### Using Azure CLI

```bash
KEY_VAULT_NAME="gathergrove-kv-prod"

# Store JWT Secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "JwtSecretKey" \
  --value "<your-generated-jwt-secret>"

# Store CSRF Secret
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "CsrfSecretKey" \
  --value "<your-generated-csrf-secret>"

# Store Encryption Master Key
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "EncryptionMasterKey" \
  --value "<your-generated-encryption-key>"

# Store Encryption IV
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "EncryptionIV" \
  --value "<your-generated-encryption-iv>"

# Store Stripe Secret Key (get from Stripe Dashboard)
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "StripeSecretKey" \
  --value "<your-stripe-secret-key>"

# Store Stripe Webhook Secret (get from Stripe Dashboard)
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name "StripeWebhookSecret" \
  --value "<your-stripe-webhook-secret>"
```

### Secret Naming Convention

| Application Setting | Key Vault Secret Name | Description |
|---------------------|----------------------|-------------|
| `JwtSettings:SecretKey` | `JwtSecretKey` | JWT token signing key |
| `Security:CSRFSecretKey` | `CsrfSecretKey` | CSRF token encryption key |
| `Encryption:MasterKey` | `EncryptionMasterKey` | AES-256 encryption key |
| `Encryption:InitializationVector` | `EncryptionIV` | AES encryption IV |
| `Stripe:SecretKey` | `StripeSecretKey` | Stripe API secret key |
| `Stripe:WebhookSecret` | `StripeWebhookSecret` | Stripe webhook signing secret |
| `AzureCommunicationServices:ConnectionString` | `AcsConnectionString` | Azure Communication Services |
| `AzureStorage:ConnectionString` | `StorageConnectionString` | Azure Storage account |

---

## Step 3: Configure Application to Use Key Vault

### Update appsettings.json

Replace secret values with Key Vault references:

```json
{
  "JwtSettings": {
    "SecretKey": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/JwtSecretKey/)",
    "Issuer": "GatherGrove",
    "Audience": "GatherGrove",
    "ExpiryMinutes": "60"
  },
  "Security": {
    "CSRFSecretKey": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/CsrfSecretKey/)",
    "RateLimitPerMinute": 100,
    "EnableXssProtection": true,
    "EnableSqlInjectionProtection": true
  },
  "Encryption": {
    "MasterKey": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/EncryptionMasterKey/)",
    "InitializationVector": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/EncryptionIV/)"
  },
  "Stripe": {
    "SecretKey": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/StripeSecretKey/)",
    "PublishableKey": "pk_live_...",
    "WebhookSecret": "@Microsoft.KeyVault(SecretUri=https://gathergrove-kv-prod.vault.azure.net/secrets/StripeWebhookSecret/)"
  }
}
```

### Enable Key Vault in Program.cs

The application should already be configured to use Azure App Configuration with Key Vault. Verify this code exists in `Program.cs`:

```csharp
// Add this in the configuration setup
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{builder.Configuration["KeyVaultName"]}.vault.azure.net/"),
    new DefaultAzureCredential());
```

If not present, add the NuGet package and configuration:

```bash
cd backend/src/GatherGrove.API
dotnet add package Azure.Identity
dotnet add package Azure.Extensions.AspNetCore.Configuration.Secrets
```

---

## Step 4: Configure App Service

### Set Key Vault Name in Application Settings

#### Using Azure Portal

1. Go to your App Service
2. Navigate to "Configuration" → "Application settings"
3. Add new setting:
   - **Name**: `KeyVaultName`
   - **Value**: `gathergrove-kv-prod` (your Key Vault name without .vault.azure.net)

#### Using Azure CLI

```bash
az webapp config appsettings set \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings KeyVaultName="gathergrove-kv-prod"
```

### Restart App Service

```bash
az webapp restart \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP
```

---

## Step 5: Verify Configuration

### Test Secret Access

1. **Check Application Logs**
   - Go to App Service → "Log stream"
   - Look for any Key Vault access errors

2. **Test Health Endpoint**
   ```bash
   curl https://your-app.azurewebsites.net/api/v1/health
   ```
   - Should return healthy status
   - JWT secret should be loaded

3. **Verify in Application Insights**
   - Check for any authentication errors
   - Verify JWT token generation works

### Common Issues and Solutions

#### Issue: "Access denied" errors

**Solution**: Verify managed identity has correct permissions:
```bash
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

#### Issue: "Secret not found"

**Solution**: Verify secret name matches exactly (case-sensitive):
```bash
az keyvault secret list --vault-name $KEY_VAULT_NAME
```

#### Issue: App won't start after Key Vault configuration

**Solution**: Check Key Vault URI is correct:
- Format: `https://{vault-name}.vault.azure.net/secrets/{secret-name}/`
- No trailing slash after secret name

---

## Step 6: Secret Rotation Strategy

### Recommended Rotation Schedule

| Secret Type | Rotation Frequency | Notes |
|-------------|-------------------|-------|
| JWT Secret | 90 days | Requires re-login for all users |
| CSRF Secret | 90 days | Requires new CSRF tokens |
| Encryption Keys | 180 days | Requires data re-encryption |
| Stripe Keys | As needed | Only when compromised |
| API Keys | 90 days | Service-specific |

### Rotation Process

1. **Generate new secret**
2. **Add to Key Vault with version**
3. **Update application to support both old and new keys (grace period)**
4. **Monitor for 24-48 hours**
5. **Remove old key**
6. **Update backup documentation**

### Encryption Key Rotation

⚠️ **CRITICAL**: Encryption key rotation requires special handling!

```csharp
// Implement key versioning in EncryptionService
public class EncryptionService
{
    private readonly Dictionary<string, byte[]> _keyVersions;

    public EncryptionService(IConfiguration configuration)
    {
        _keyVersions = new Dictionary<string, byte[]>
        {
            ["current"] = Convert.FromBase64String(configuration["Encryption:MasterKey"]),
            ["previous"] = Convert.FromBase64String(configuration["Encryption:MasterKeyPrevious"])
        };
    }

    // Decrypt with fallback to previous key
    // Re-encrypt with current key
}
```

---

## Step 7: Monitoring and Auditing

### Enable Key Vault Diagnostics

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "gathergrove-logs-prod"

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group $RESOURCE_GROUP \
  --workspace-name "gathergrove-logs-prod" \
  --query id -o tsv)

# Enable diagnostics
az monitor diagnostic-settings create \
  --name "KeyVaultDiagnostics" \
  --resource "/subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME" \
  --workspace $WORKSPACE_ID \
  --logs '[{"category": "AuditEvent", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]'
```

### Set Up Alerts

1. **Secret Access Failures**
   - Alert when access denied count > 5 in 5 minutes
   - Indicates potential attack or misconfiguration

2. **Unusual Access Patterns**
   - Alert when access frequency suddenly increases
   - May indicate key compromise

3. **Secret Expiration**
   - Alert 30 days before secret expiration
   - Reminder to rotate keys

---

## Step 8: Backup and Disaster Recovery

### Backup Secrets

```bash
#!/bin/bash
# Backup all secrets from Key Vault

KEY_VAULT_NAME="gathergrove-kv-prod"
BACKUP_DIR="./keyvault-backup-$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Get all secret names
SECRETS=$(az keyvault secret list --vault-name $KEY_VAULT_NAME --query "[].name" -o tsv)

# Backup each secret
for SECRET in $SECRETS; do
  echo "Backing up: $SECRET"
  az keyvault secret backup \
    --vault-name $KEY_VAULT_NAME \
    --name $SECRET \
    --file "$BACKUP_DIR/$SECRET.backup"
done

echo "Backup complete: $BACKUP_DIR"
echo "IMPORTANT: Encrypt this backup and store in secure location!"
```

### Restore Secrets

```bash
#!/bin/bash
# Restore secrets to Key Vault

KEY_VAULT_NAME="gathergrove-kv-prod"
BACKUP_DIR="./keyvault-backup-2025-11-21"

# Restore each secret
for BACKUP_FILE in $BACKUP_DIR/*.backup; do
  SECRET_NAME=$(basename $BACKUP_FILE .backup)
  echo "Restoring: $SECRET_NAME"
  az keyvault secret restore \
    --vault-name $KEY_VAULT_NAME \
    --file "$BACKUP_FILE"
done

echo "Restore complete"
```

---

## Security Best Practices

### ✅ DO

- ✅ Enable soft delete and purge protection
- ✅ Use managed identities for authentication
- ✅ Grant least-privilege access (Get, List only)
- ✅ Enable diagnostic logging
- ✅ Regularly rotate secrets
- ✅ Backup secrets to secure location
- ✅ Use separate Key Vaults for prod/staging/dev
- ✅ Tag secrets with metadata (created date, owner, purpose)

### ❌ DON'T

- ❌ Store secrets in source control
- ❌ Use the same secrets across environments
- ❌ Grant "All" permissions
- ❌ Disable soft delete in production
- ❌ Share Key Vault access credentials
- ❌ Store backup files in source control
- ❌ Use weak or predictable secrets

---

## Troubleshooting

### Check Managed Identity is Enabled

```bash
az webapp identity show \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP
```

Should return:
```json
{
  "principalId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "type": "SystemAssigned"
}
```

### Verify Access Policy

```bash
az keyvault show \
  --name $KEY_VAULT_NAME \
  --query "properties.accessPolicies"
```

### Test Secret Retrieval

```bash
az keyvault secret show \
  --vault-name $KEY_VAULT_NAME \
  --name "JwtSecretKey" \
  --query "value"
```

---

## Quick Reference

### Environment-Specific Key Vaults

| Environment | Key Vault Name | Purpose |
|-------------|----------------|---------|
| Development | `gathergrove-kv-dev` | Local development testing |
| Staging | `gathergrove-kv-staging` | Pre-production testing |
| Production | `gathergrove-kv-prod` | Live production |

### Required Secrets Checklist

- [ ] JwtSecretKey
- [ ] CsrfSecretKey
- [ ] EncryptionMasterKey
- [ ] EncryptionIV
- [ ] StripeSecretKey
- [ ] StripeWebhookSecret
- [ ] AcsConnectionString (optional)
- [ ] StorageConnectionString (optional)

### Useful Commands

```bash
# List all secrets
az keyvault secret list --vault-name $KEY_VAULT_NAME

# Get secret value
az keyvault secret show --vault-name $KEY_VAULT_NAME --name "SecretName"

# Update secret
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "SecretName" --value "NewValue"

# Delete secret (soft delete)
az keyvault secret delete --vault-name $KEY_VAULT_NAME --name "SecretName"

# Purge secret (permanent)
az keyvault secret purge --vault-name $KEY_VAULT_NAME --name "SecretName"

# List deleted secrets
az keyvault secret list-deleted --vault-name $KEY_VAULT_NAME

# Recover deleted secret
az keyvault secret recover --vault-name $KEY_VAULT_NAME --name "SecretName"
```

---

## Support

For issues with Azure Key Vault setup:
1. Check Azure status page
2. Review Application Insights logs
3. Contact Azure support
4. Review this documentation

For GatherGrove-specific configuration:
- See `backend/.env.example` for local development
- See `backend/SECRETS-MANAGEMENT.md` for additional guidance
- Check Application Insights for runtime errors
