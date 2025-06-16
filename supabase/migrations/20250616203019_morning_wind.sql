/*
  # Enhanced Nutrition Tracking System

  1. New Tables
    - `foods` - Master food database with nutritional information
    - `meal_entries` - Detailed meal logging with portions and calories
    - `daily_nutrition` - Aggregated daily nutrition summary

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user data access

  3. Features
    - Track macros and micronutrients
    - Portion control and calorie counting
    - Daily nutrition goals and progress
*/

-- Foods master table
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category text NOT NULL,
  serving_size text NOT NULL,
  calories_per_serving numeric(8,2) NOT NULL,
  protein_g numeric(6,2) DEFAULT 0,
  carbs_g numeric(6,2) DEFAULT 0,
  fat_g numeric(6,2) DEFAULT 0,
  fiber_g numeric(6,2) DEFAULT 0,
  sugar_g numeric(6,2) DEFAULT 0,
  sodium_mg numeric(8,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Detailed meal entries
CREATE TABLE IF NOT EXISTS meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  food_id uuid REFERENCES foods(id) NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  servings numeric(6,2) NOT NULL DEFAULT 1,
  total_calories numeric(8,2) NOT NULL,
  total_protein_g numeric(6,2) DEFAULT 0,
  total_carbs_g numeric(6,2) DEFAULT 0,
  total_fat_g numeric(6,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily nutrition summary
CREATE TABLE IF NOT EXISTS daily_nutrition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_calories numeric(8,2) DEFAULT 0,
  total_protein_g numeric(6,2) DEFAULT 0,
  total_carbs_g numeric(6,2) DEFAULT 0,
  total_fat_g numeric(6,2) DEFAULT 0,
  total_fiber_g numeric(6,2) DEFAULT 0,
  water_intake_ml integer DEFAULT 0,
  goal_calories numeric(8,2),
  goal_protein_g numeric(6,2),
  goal_carbs_g numeric(6,2),
  goal_fat_g numeric(6,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition ENABLE ROW LEVEL SECURITY;

-- Foods policies (public read access)
CREATE POLICY "Everyone can read foods"
  ON foods
  FOR SELECT
  TO authenticated
  USING (true);

-- Meal entries policies
CREATE POLICY "Users can read own meal entries"
  ON meal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal entries"
  ON meal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal entries"
  ON meal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal entries"
  ON meal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily nutrition policies
CREATE POLICY "Users can read own daily nutrition"
  ON daily_nutrition
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily nutrition"
  ON daily_nutrition
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily nutrition"
  ON daily_nutrition
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_meal_type ON meal_entries(meal_type);
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date ON daily_nutrition(user_id, date);

-- Function to update daily nutrition totals
CREATE OR REPLACE FUNCTION update_daily_nutrition()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert daily nutrition summary
  INSERT INTO daily_nutrition (
    user_id, 
    date, 
    total_calories, 
    total_protein_g, 
    total_carbs_g, 
    total_fat_g
  )
  SELECT 
    user_id,
    date,
    SUM(total_calories),
    SUM(total_protein_g),
    SUM(total_carbs_g),
    SUM(total_fat_g)
  FROM meal_entries
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND date = COALESCE(NEW.date, OLD.date)
  GROUP BY user_id, date
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein_g = EXCLUDED.total_protein_g,
    total_carbs_g = EXCLUDED.total_carbs_g,
    total_fat_g = EXCLUDED.total_fat_g,
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily nutrition
CREATE TRIGGER update_daily_nutrition_trigger
  AFTER INSERT OR UPDATE OR DELETE ON meal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_nutrition();