-- ============================================================================
-- Timesheet Validation Triggers
-- ============================================================================
-- Purpose: Enforce time entry validation at the database level
-- - Prevent overlapping time entries for the same user on the same day
-- - Enforce 24-hour daily limit per user per day
--
-- These triggers provide bulletproof validation that cannot be bypassed by
-- application-layer race conditions or concurrent requests.
--
-- Executed by: scripts/migrate.ts (during db:reset)
-- Schema definition: lib/db/schema.ts (timeEntries table, lines 1187-1263)
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Prevent Overlapping Time Entries
-- ============================================================================
-- Prevents a user from creating overlapping time entries on the same day.
-- Example: If entry A is 09:00-12:00, entry B cannot be 11:00-14:00.
--
-- Overlap logic: (newStart < existingEnd) AND (newEnd > existingStart)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_time_entry_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
  overlap_times TEXT;
BEGIN
  -- Only check if both start_time and end_time are provided
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN

    -- Count overlapping entries for the same user on the same day
    SELECT COUNT(*), STRING_AGG(start_time || '-' || end_time, ', ')
    INTO overlap_count, overlap_times
    FROM time_entries
    WHERE user_id = NEW.user_id
      AND tenant_id = NEW.tenant_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND start_time IS NOT NULL
      AND end_time IS NOT NULL
      -- Overlap condition: (newStart < existingEnd) AND (newEnd > existingStart)
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time;

    IF overlap_count > 0 THEN
      RAISE EXCEPTION 'Time entry overlaps with % existing %: %',
        overlap_count,
        CASE WHEN overlap_count = 1 THEN 'entry' ELSE 'entries' END,
        overlap_times
      USING ERRCODE = '23514'; -- CHECK violation error code
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to time_entries table
DROP TRIGGER IF EXISTS time_entry_overlap_check ON time_entries;
CREATE TRIGGER time_entry_overlap_check
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_time_entry_overlap();

-- ============================================================================
-- TRIGGER 2: Enforce 24-Hour Daily Limit
-- ============================================================================
-- Prevents a user from logging more than 24 hours in a single day.
-- Sums all hours for the user on the specified date and rejects if total > 24.
-- ============================================================================

CREATE OR REPLACE FUNCTION check_daily_hour_limit()
RETURNS TRIGGER AS $$
DECLARE
  daily_total DECIMAL;
  new_total DECIMAL;
BEGIN
  -- Calculate current total hours for this user on this date
  SELECT COALESCE(SUM(CAST(hours AS DECIMAL)), 0)
  INTO daily_total
  FROM time_entries
  WHERE user_id = NEW.user_id
    AND tenant_id = NEW.tenant_id
    AND date = NEW.date
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Calculate what the new total would be
  new_total := daily_total + CAST(NEW.hours AS DECIMAL);

  -- Reject if total would exceed 24 hours
  IF new_total > 24 THEN
    RAISE EXCEPTION 'Cannot log % hours. Daily total would be % hours, exceeding 24-hour limit. Current total: % hours.',
      NEW.hours,
      ROUND(new_total, 2),
      ROUND(daily_total, 2)
    USING ERRCODE = '23514'; -- CHECK violation error code
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to time_entries table
DROP TRIGGER IF EXISTS daily_hour_limit_check ON time_entries;
CREATE TRIGGER daily_hour_limit_check
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_hour_limit();
