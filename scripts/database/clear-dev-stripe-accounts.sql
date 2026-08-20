-- Clear development Stripe account IDs
UPDATE Clubs
SET StripeAccountId = NULL
WHERE StripeAccountId = 'acct_DEV_SIMULATED';

-- Show affected clubs
SELECT Id, Name, StripeAccountId
FROM Clubs
WHERE StripeAccountId IS NULL OR StripeAccountId = 'acct_DEV_SIMULATED';