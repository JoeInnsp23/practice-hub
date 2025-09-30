-- Add 'onboarding' status to client_status enum
ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'onboarding' BEFORE 'active';

-- Update existing clients with active status and incomplete onboarding to onboarding status
UPDATE clients
SET status = 'onboarding', updated_at = NOW()
WHERE status = 'active'
  AND created_at > NOW() - INTERVAL '30 days'
  AND id IN (
    SELECT client_id
    FROM onboarding_sessions
    WHERE status != 'completed'
  );
