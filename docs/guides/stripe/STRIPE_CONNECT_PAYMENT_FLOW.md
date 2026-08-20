# Stripe Connect Payment Flow in GatherGrove

## Overview

GatherGrove uses Stripe Connect to enable clubs to accept online payments from their members. The platform takes a percentage fee from each transaction based on the club's subscription tier.

## Key Concepts

### Platform Account vs Connected Accounts
- **Platform Account**: GatherGrove's main Stripe account that orchestrates all payments
- **Connected Accounts**: Individual Stripe accounts for each club (Express accounts)
- **Members**: Pay directly to their club through the platform

### Platform Fee Structure
- **Grow Tier**: 2% platform fee
- **Sprout Tier**: 7% platform fee

## Payment Models

GatherGrove supports two payment models depending on regional constraints:

### 1. Destination Charges with Application Fees (Primary Model)

Used when platform and connected accounts are in the same region (e.g., both in US).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 DESTINATION CHARGES WITH APPLICATION FEES                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Member                    Stripe                      Club             │
│    │                         │                          │               │
│    │    $100 Payment         │                          │               │
│    ├────────────────────────►│                          │               │
│    │                         │                          │               │
│    │                         │   $100 Direct Charge     │               │
│    │                         ├─────────────────────────►│               │
│    │                         │                          │               │
│    │                         │   $2.00 App Fee (Grow)  │               │
│    │                         │◄─────────────────────────┤               │
│    │                         │                          │               │
│    │                         │                          │               │
│  Platform                    │                          │               │
│    │                         │                          │               │
│    │◄────────────────────────┤                          │               │
│    │   $2.00 Platform Fee    │                          │               │
│                                                                         │
│  Result: Club receives $100, Stripe automatically deducts $2.00 for    │
│          platform, Club's net payout is $98.00                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Implementation:**
```csharp
// PaymentService.cs - Lines 271-280
if (useApplicationFees)
{
    // Use destination charges with application fees
    paymentIntentOptions.TransferData = new PaymentIntentTransferDataOptions
    {
        Destination = paymentToken.Club.StripeAccountId
    };
    paymentIntentOptions.ApplicationFeeAmount = (long)(platformFee * 100);
}
```

### 2. Manual Transfers (Cross-Border Model)

Used when platform and connected accounts are in different regions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MANUAL TRANSFER MODEL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Member                    Platform                    Club             │
│    │                         │                          │               │
│    │    $100 Payment         │                          │               │
│    ├────────────────────────►│                          │               │
│    │                         │                          │               │
│    │                         │   Keep $2.00 (2%)       │               │
│    │                         ├─ ─ ─ ─ ─ ─ ─ ─ ┐        │               │
│    │                         │                          │               │
│    │                         │   Transfer $98.00       │               │
│    │                         ├─────────────────────────►│               │
│    │                         │                          │               │
│                                                                         │
│  Result: Platform receives $100, keeps $2.00, transfers $98.00 to club │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Implementation:**
```csharp
// PaymentService.cs - Lines 315-337
if (!useApplicationFees && paymentIntent.Status == "succeeded")
{
    var transferService = new TransferService();
    var transferAmount = (long)((paymentToken.Amount - platformFee) * 100);
    
    var transfer = await transferService.CreateAsync(new TransferCreateOptions
    {
        Amount = transferAmount,
        Currency = "usd",
        Destination = paymentToken.Club.StripeAccountId,
        Description = $"Transfer for {paymentToken.Description}",
        SourceTransaction = paymentIntent.LatestChargeId
    });
}
```

## Complete Payment Flow

### Step 1: Club Setup
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STRIPE CONNECT SETUP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Club Admin initiates Stripe Connect                                │
│     POST /api/v1/stripeconnect/link                                    │
│                                                                         │
│  2. Platform creates Express account                                   │
│     - Type: "express"                                                  │
│     - Country: US (configurable)                                       │
│     - Capabilities: card_payments, transfers                           │
│                                                                         │
│  3. Club Admin completes onboarding                                    │
│     - Identity verification                                            │
│     - Bank account setup                                               │
│     - Business information                                             │
│                                                                         │
│  4. Club.StripeAccountId saved in database                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Payment Request
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT REQUEST FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Club requests payment from member                                  │
│     POST /api/v1/clubs/{clubId}/members/{memberId}/request-payment    │
│                                                                         │
│  2. System generates secure payment token                              │
│     - Unique token with 24-hour expiration                             │
│     - Stored in PaymentTokens table                                    │
│                                                                         │
│  3. Email sent to member with payment link                             │
│     https://app.gathergrove.club/payment/{token}                       │
│                                                                         │
│  4. Member clicks link and views payment page                          │
│     - Shows club name, amount, description                             │
│     - Stripe Elements for card input                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Payment Processing
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT PROCESSING                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Member submits payment                                              │
│     POST /api/v1/payments/{token}/process                              │
│                                                                         │
│  2. Platform creates PaymentIntent                                      │
│     - Amount: $100.00 (example)                                        │
│     - Application Fee: $2.00 (2% for Grow tier)                       │
│     - Destination: Club's Stripe Account                               │
│                                                                         │
│  3. Payment recorded in database                                        │
│     - Payment record created                                           │
│     - Member's DuesPaidUntil updated                                   │
│     - Token marked as used                                             │
│                                                                         │
│  4. Funds distribution                                                  │
│     - Club receives payment minus platform fee                         │
│     - Platform receives application fee                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Platform Fee Examples

### Grow Tier (2% fee)
| Payment Amount | Platform Fee | Club Receives |
|----------------|--------------|---------------|
| $50.00         | $1.00        | $49.00        |
| $100.00        | $2.00        | $98.00        |
| $250.00        | $5.00        | $245.00       |
| $500.00        | $10.00       | $490.00       |

### Sprout Tier (7% fee)
| Payment Amount | Platform Fee | Club Receives |
|----------------|--------------|---------------|
| $50.00         | $3.50        | $46.50        |
| $100.00        | $7.00        | $93.00        |
| $250.00        | $17.50       | $232.50       |
| $500.00        | $35.00       | $465.00       |

## Key Benefits

### For Clubs
1. **Direct Payment Reception**: Funds go directly to club's Stripe account
2. **Automatic Reconciliation**: Platform fee automatically deducted
3. **Professional Payment Experience**: Members pay through secure, branded pages
4. **Real-time Updates**: Member dues status updated immediately

### For Platform (GatherGrove)
1. **Automated Fee Collection**: No manual invoicing required
2. **Scalable Revenue Model**: Fees scale with transaction volume
3. **Compliance**: Stripe handles regulatory requirements
4. **Flexibility**: Supports both same-region and cross-border scenarios

## Configuration Requirements

### Environment Variables
```bash
# Required for all deployments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# For cross-border deployments
Stripe__UseApplicationFees=false
```

### Database Requirements
- Clubs table must have `StripeAccountId` column
- PaymentTokens table for secure payment links
- Payments table for transaction records

## Security Considerations

1. **Token Security**
   - Cryptographically secure 32-byte tokens
   - 24-hour expiration
   - Single-use only
   - URL-safe encoding

2. **Payment Security**
   - All payments processed through Stripe's PCI-compliant infrastructure
   - No card details stored in GatherGrove database
   - HTTPS required for all payment pages

3. **Access Control**
   - Only club admins can request payments
   - Members can only pay using valid tokens
   - Tokens tied to specific member and amount

## Troubleshooting Common Issues

### "Stripe Connect not enabled"
- Solution: Visit https://dashboard.stripe.com/connect/onboarding
- Complete platform profile setup

### Cross-border payment failures
- Set `UseApplicationFees=false` in configuration
- System will use manual transfers instead

### Transfer failures in cross-border mode
- Payment succeeds but transfer fails
- Requires manual intervention
- Check Stripe dashboard for transfer errors

## Testing Payments

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

### Test Amounts
- Any amount works in test mode
- Use realistic amounts for better testing

## Monitoring and Reporting

### Key Metrics to Track
1. **Payment Success Rate**: Monitor failed payments
2. **Platform Revenue**: Track fees by tier
3. **Club Activity**: Identify active vs inactive clubs
4. **Token Usage**: Monitor expired vs used tokens

### Stripe Dashboard
- View all transactions at https://dashboard.stripe.com
- Monitor connected accounts
- Track platform fees and transfers

## Future Enhancements

1. **Recurring Payments**: Automatic monthly/annual billing
2. **Payment Plans**: Split large payments
3. **Multiple Payment Methods**: ACH, digital wallets
4. **International Currency**: Support non-USD payments