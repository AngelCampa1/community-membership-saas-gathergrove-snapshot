# Stripe Deployment Guide for GatherGrove

## Overview
GatherGrove uses Stripe Connect to enable clubs to accept payments from their members. The platform takes a percentage fee (2% for Grow tier, 7% for Sprout tier) from each transaction.

**New: Global Support** - The platform now automatically detects cross-region payment scenarios and handles them appropriately.

## Platform Requirements

### For US Market Deployment
If you're deploying GatherGrove for US clubs:

1. **Stripe Platform Account**: Create your Stripe account in the United States
2. **Configuration**: Ensure `DefaultCountry` is set to `"US"` in all appsettings files
3. **Stripe Connect**: Enable Stripe Connect on your platform account at https://dashboard.stripe.com/connect/onboarding

### For International/Cross-Border Deployment
If your Stripe platform account is in a different country than your target market:

1. **Configuration**: Set `UseApplicationFees` to `"false"` in appsettings to enable manual transfer mode
2. **Manual Transfers**: The system will automatically handle transfers after payment, deducting the platform fee
3. **Important**: Some cross-border combinations may not be supported by Stripe

## Configuration Settings

### appsettings.json
```json
{
  "Stripe": {
    "SecretKey": "your_stripe_secret_key",
    "PublishableKey": "your_stripe_publishable_key",
    "WebhookSecret": "your_webhook_secret",
    "GrowMonthlyPriceId": "your_grow_price_id",
    "IsConnectEnabled": true,
    "PlatformCountry": "US",      // Your platform's Stripe account country
    "DefaultCountry": "US"        // Default country for new connected accounts
  }
}
```

### Global Support Features

1. **Automatic Cross-Region Detection**: The system automatically detects when platform and connected accounts are in different regions
2. **Dynamic Country Selection**: Clubs can select their country during Stripe setup
3. **Supported Countries API**: `/api/v1/billing/supported-countries` endpoint shows all supported countries
4. **Smart Fee Handling**: 
   - Same-region: Uses Stripe's application fees (instant, automatic)
   - Cross-region: Uses manual transfers (platform receives payment, then transfers minus fee)

## Deployment Steps

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Choose the country that matches your primary market

2. **Enable Stripe Connect**
   - Go to https://dashboard.stripe.com/connect/onboarding
   - Complete the platform profile
   - Review and accept the Stripe Connect platform agreement

3. **Configure API Keys**
   - Get your API keys from https://dashboard.stripe.com/apikeys
   - Update appsettings with your keys

4. **Test the Integration**
   - Use Stripe test mode first
   - Create a test connected account
   - Process a test payment

## Troubleshooting

### "Application fees not supported" Error
This occurs when your platform and connected accounts are in different regions. Solutions:
- Create your platform account in the same country as your target market
- Or set `UseApplicationFees` to `"false"` to use manual transfers

### "Connect not enabled" Error
- Visit https://dashboard.stripe.com/connect/onboarding
- Complete the platform profile setup
- Accept the Stripe Connect agreement

## Security Notes
- Never commit real Stripe keys to version control
- Use environment variables or secure configuration management for production
- Ensure all payment pages use HTTPS in production