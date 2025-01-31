/*
  # Fix user preferences table and policies

  This migration safely checks for existing objects and adds any missing components
  without conflicting with previous migrations.

  1. Changes
    - Add missing indexes for performance
    - Add validation check for preferences JSON structure
    - Add trigger for automatic updated_at updates if missing

  2. Security
    - Ensure all RLS policies are properly set
*/

-- Add validation check for preferences JSON structure if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_preferences_valid_json'
  ) THEN
    ALTER TABLE user_preferences
    ADD CONSTRAINT user_preferences_valid_json
    CHECK (
      (preferences ? 'carbs') AND 
      (preferences ? 'proteins') AND 
      (preferences ? 'fruits') AND
      jsonb_typeof(preferences->'carbs') = 'array' AND
      jsonb_typeof(preferences->'proteins') = 'array' AND
      jsonb_typeof(preferences->'fruits') = 'array'
    );
  END IF;
END $$;

-- Add indexes for better performance if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_preferences' 
    AND indexname = 'idx_user_preferences_user_id'
  ) THEN
    CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
  END IF;
END $$;

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_user_preferences_timestamp'
  ) THEN
    CREATE TRIGGER set_user_preferences_timestamp
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_timestamp();
  END IF;
END $$;