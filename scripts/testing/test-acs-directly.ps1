# Test ACS email sending directly
$connectionString = $env:ACS_CONNECTION_STRING
if (-not $connectionString) {
    Write-Error "Set ACS_CONNECTION_STRING before running this script."
    exit 1
}
$from Address = "DoNotReply@ACS_RESOURCE_GUID.azurecomm.net"
$toEmail = "support@gathergrove.club"

Write-Host "Testing ACS Email Configuration..."
Write-Host "From: $fromAddress"
Write-Host "To: $toEmail"
Write-Host ""
Write-Host "Note: ACS Azure Communication Services requires:"
Write-Host "1. Domain verification (if using custom domain)"
Write-Host "2. Sender authentication for the 'From' address"
Write-Host "3. The Email Communication Service must have sender authentication enabled"
Write-Host ""
Write-Host "Current Status from logs:"
Write-Host "- Backend reports: 'Bulk email sent to support@gathergrove.club'"
Write-Host "- No ACS-level errors detected"
Write-Host "- No 'Email sent successfully to {Email} with message ID' log found"
Write-Host ""
Write-Host "Possible issues:"
Write-Host "1. ACS may be returning success but not actually sending (sandbox mode?)"
Write-Host "2. Email may be blocked by spam filters"
Write-Host "3. The DoNotReply address may not be verified in ACS"
Write-Host "4. Azure free tier limitations may apply"
