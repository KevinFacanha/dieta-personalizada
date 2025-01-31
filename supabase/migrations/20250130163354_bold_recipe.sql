/*
  # Add snack columns to meal history

  1. Changes
    - Add morning_snack and afternoon_snack columns to meal_history table
    - Keep existing table structure and policies intact

  2. Security
    - No changes to existing RLS policies
*/

-- Add new columns to meal_history table
ALTER TABLE IF EXISTS meal_history
ADD COLUMN IF NOT EXISTS morning_snack boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS afternoon_snack boolean DEFAULT false;