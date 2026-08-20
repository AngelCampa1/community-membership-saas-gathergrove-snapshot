-- Migrate legacy Sprout clubs to Grow 30-day trial lifecycle.
-- Run once during rollout after deploying trial/claim logic.

BEGIN TRANSACTION;

UPDATE Clubs
SET
    Tier = 'Grow',
    SubscriptionStatus = 'trialing',
    TrialExpiresAt = DATEADD(day, 30, GETUTCDATE()),
    UpdatedAt = GETUTCDATE()
WHERE Tier = 'Sprout';

COMMIT TRANSACTION;
