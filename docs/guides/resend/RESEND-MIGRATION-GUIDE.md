# Resend Email Migration Guide

## Overview

GatherGrove has been migrated from Azure Communication Services (ACS) to Resend for all email communications. This guide covers what you need to do to complete the setup.

---

## ✅ What's Been Done

- ✅ Resend .NET SDK (v0.2.1) installed
- ✅ ResendEmailService implemented with all 14 email methods
- ✅ Configuration files updated with Resend section
- ✅ Dependency injection configured in Program.cs
- ✅ ACS code and dependencies removed
- ✅ Build successful, merged to main, pushed to remote

---

## 🔧 Required Actions

### 1. Get Resend API Key

**Steps:**
1. Go to https://resend.com/
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Give it a name (e.g., "GatherGrove Production")
6. Copy the API key (starts with `re_`)

**Where to Add:**
- **Development**: Add to `backend/src/GatherGrove.API/appsettings.Development.json`
  ```json
  {
    "Resend": {
      "ApiToken": "re_your_api_key_here"
    }
  }
  ```
- **Production**: Store in Azure Key Vault or environment variable `RESEND__APITOKEN`

---

### 2. Verify Domain in Resend

**Domain to Verify:** `gathergrove.club`

**Steps:**

#### A. Add Domain in Resend Dashboard
1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `gathergrove.club`
4. Click **Add**

#### B. Configure DNS Records
Resend will provide you with DNS records to add. You'll need to add:

**SPF Record (TXT):**
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records (CNAME):**
Resend will provide 2-3 CNAME records like:
```
Type: CNAME
Host: resend._domainkey.gathergrove.club
Value: [provided by Resend]
```

**Where to Add DNS Records:**
- Log in to your domain registrar (e.g., GoDaddy, Cloudflare, Namecheap)
- Go to DNS management for `gathergrove.club`
- Add the TXT and CNAME records provided by Resend
- Save changes

#### C. Verify Domain
1. Wait 5-10 minutes for DNS propagation
2. In Resend dashboard, click **Verify** next to your domain
3. Status should change from "Pending" to "Verified"

**⏰ DNS Propagation:** Can take up to 72 hours, but usually completes in 5-30 minutes

---

### 3. Configure Email Forwarding (ventoralabs.com)

You want `contact@ventoralabs.com` to forward to `noreply@ventoralabs.com`.

#### Option A: Google Workspace (Recommended if you have it)

1. Go to **Google Admin Console** (admin.google.com)
2. Navigate to **Users** → Select your user
3. Click **User information** → **Email aliases**
4. Add alias: `contact@ventoralabs.com`
5. All emails to contact@ will now arrive in the configured admin inbox

#### Option B: Microsoft 365

1. Go to **Microsoft 365 Admin Center**
2. **Users** → **Active Users**
3. Select user: Angel Campa
4. Click **Manage email aliases**
5. Add: `contact@ventoralabs.com`

#### Option C: Cloudflare Email Routing (Free)

1. Go to **Cloudflare Dashboard** → Select `ventoralabs.com`
2. Navigate to **Email** → **Email Routing**
3. Enable Email Routing
4. Add destination address: `noreply@ventoralabs.com` (verify it)
5. Create routing rule:
   - **From:** `contact@ventoralabs.com`
   - **Action:** Forward to `noreply@ventoralabs.com`
6. Add MX records (Cloudflare provides these automatically)

#### Option D: ImprovMX (Free Tier Available)

1. Go to https://improvmx.com/
2. Sign up for free account
3. Add domain: `ventoralabs.com`
4. Create alias: `contact@ventoralabs.com` → `noreply@ventoralabs.com`
5. Add MX records to DNS:
   ```
   Priority 10: mx1.improvmx.com
   Priority 20: mx2.improvmx.com
   ```

---

### 4. Update Configuration Files

#### Development Configuration
**File:** `backend/src/GatherGrove.API/appsettings.Development.json`

```json
{
  "Resend": {
    "ApiToken": "re_YOUR_DEV_API_KEY",
    "FromEmailAddress": "support@gathergrove.club",
    "FromName": "GatherGrove",
    "WebhookSecret": ""
  }
}
```

#### Production Configuration
**File:** Azure Key Vault or Environment Variables

```bash
RESEND__APITOKEN=re_YOUR_PROD_API_KEY
RESEND__FROMEMAILADDRESS=support@gathergrove.club
RESEND__FROMNAME=GatherGrove
RESEND__WEBHOOKSECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

### 5. Test Email Sending (Optional but Recommended)

**Quick Test Script:**

Create a test file: `backend/tests/GatherGrove.Application.Tests/Services/ResendEmailServiceManualTest.cs`

```csharp
[Test]
[Explicit("Manual test - sends real email")]
public async Task TestResendEmailService_SendsRealEmail()
{
    // Arrange
    var configuration = new ConfigurationBuilder()
        .AddJsonFile("../../../../src/GatherGrove.API/appsettings.Development.json")
        .Build();

    var settings = new ResendSettings();
    configuration.GetSection("Resend").Bind(settings);
    var options = Options.Create(settings);

    var httpClient = new HttpClient();
    var clientOptions = Options.Create(new ResendClientOptions { ApiToken = settings.ApiToken });
    var resendClient = new ResendClient(clientOptions, httpClient);

    var logger = new NullLogger<ResendEmailService>();
    var urlService = new Mock<IUrlService>().Object;

    var service = new ResendEmailService(resendClient, options, logger, urlService);

    // Act
    var result = await service.SendEmailAsync(
        "your-email@example.com",
        "Test Email from Resend",
        "<p>This is a test email from GatherGrove using Resend!</p>");

    // Assert
    Assert.That(result, Is.True);
    Console.WriteLine("✅ Email sent successfully! Check your inbox.");
}
```

**Run the test:**
```bash
cd backend
dotnet test --filter "TestResendEmailService_SendsRealEmail"
```

---

## 📊 Email Usage Monitoring

### Resend Pricing Tiers

| Tier | Emails/Month | Price | Status |
|------|--------------|-------|--------|
| Free | 3,000 | $0 | Good for development/testing |
| Pro | 50,000 | $20/mo | Recommended for production |
| Scale | 100,000 | $90/mo | For high-volume sending |

**Current GatherGrove Limits:**
- Sprout tier: 500 emails/month
- Grow tier: 10,000 emails/month

**Recommendation:** Start with Resend Pro plan ($20/mo, 50k emails) which covers Grow tier limits with room to grow.

---

## 🔍 Verification Checklist

### Before Going Live

- [ ] Resend API key added to configuration
- [ ] Domain `gathergrove.club` verified in Resend (Status: Verified)
- [ ] SPF and DKIM DNS records added and propagated
- [ ] Test email sent and received successfully
- [ ] Email forwarding configured for `contact@ventoralabs.com`
- [ ] Production configuration stored securely (Azure Key Vault)

### Testing Checklist

Test these email types to ensure everything works:

- [ ] Member activation email
- [ ] Payment request email
- [ ] Event payment confirmation
- [ ] Bulk email to members
- [ ] Marketing welcome email
- [ ] Admin invitation email

---

## 🐛 Troubleshooting

### Issue: "Invalid API token" error

**Solution:**
- Verify API token is correct (starts with `re_`)
- Check there are no extra spaces or quotes
- Ensure token is added to the correct configuration file

### Issue: Domain not verified

**Solution:**
- Check DNS records are added correctly
- Wait 10-30 minutes for DNS propagation
- Use DNS checker: https://dnschecker.org/
- Verify TXT and CNAME records are visible

### Issue: Emails not being sent

**Solution:**
1. Check logs for error messages
2. Verify `ResendEmailService` is registered in DI
3. Check API key is valid
4. Ensure domain is verified in Resend dashboard
5. Check Resend dashboard for delivery logs

### Issue: Emails going to spam

**Solution:**
- Verify SPF and DKIM records are set up correctly
- Add DMARC record:
  ```
  Type: TXT
  Host: _dmarc.gathergrove.club
  Value: v=DMARC1; p=none; rua=mailto:dmarc@gathergrove.club
  ```
- Warm up domain by sending gradually increasing volumes
- Ensure "From" address matches verified domain

---

## 📎 Known Limitations

### Attachments (Temporary)

**Status:** Attachment support temporarily disabled pending SDK investigation.

**Affected Methods:**
- `SendLeadMagnetEmailAsync` (PDF attachments)
- `SendScheduledReportAsync` (report attachments)
- `SendEmailWithAttachmentAsync` (generic attachments)

**Workaround:** These methods will send emails but skip attachments and log warnings.

**Timeline:** Will be investigated and implemented in next phase.

---

## 🔄 Rollback Plan (If Needed)

If you need to revert to ACS:

```bash
git revert HEAD  # Revert the merge commit
git push origin main

cd backend
dotnet add src/GatherGrove.Application/GatherGrove.Application.csproj package Azure.Communication.Email
dotnet build
```

Then restore ACS configuration in appsettings.json.

---

## 📞 Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Resend .NET SDK:** https://github.com/resend/resend-dotnet
- **Resend Support:** support@resend.com
- **DNS Propagation Checker:** https://dnschecker.org/

---

## 📝 Next Steps After Setup

1. **Monitor Email Deliverability:**
   - Check Resend dashboard for delivery rates
   - Monitor bounce rates and spam complaints
   - Review email logs regularly

2. **Implement Webhook Analytics:**
   - Set up webhook endpoint for tracking opens/clicks
   - Connect to `CommunicationAnalytics` entity
   - Enable real-time engagement tracking

3. **Investigate Attachment Support:**
   - Research Resend .NET SDK attachment API
   - Implement attachment functionality
   - Test with PDF reports and lead magnets

4. **Set Up Monitoring:**
   - Configure Application Insights for email errors
   - Set up alerts for failed emails
   - Monitor API usage vs Resend limits

---

## ✅ Completion Criteria

The migration is complete when:
- ✅ API key configured (dev + prod)
- ✅ Domain verified with green status in Resend
- ✅ Test email sent and received successfully
- ✅ All 6 email types tested in staging
- ✅ Production deployment successful
- ✅ Email forwarding working for contact@ventoralabs.com
- ✅ Monitoring and alerts configured

---

**Last Updated:** January 19, 2026
**Migration Version:** 1.0
**Status:** Ready for Configuration
