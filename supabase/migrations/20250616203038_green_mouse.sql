/*
  # Analytics and Reporting System

  1. New Tables
    - `user_goals` - Detailed fitness and nutrition goals
    - `progress_measurements` - Body measurements and photos
    - `achievement_badges` - Gamification achievements
    - `weekly_reports` - Automated weekly progress reports

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access

  3. Features
    - Goal tracking and progress monitoring
    - Achievement system for motivation
    - Automated progress reports
*/

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  goal_type text NOT NULL CHECK (goal_type IN ('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'strength', 'endurance')),
  target_weight numeric(5,2),
  target_body_fat_percentage numeric(4,1),
  target_muscle_mass numeric(5,2),
  target_daily_calories integer,
  target_weekly_workouts integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progress measurements table
CREATE TABLE IF NOT EXISTS progress_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  measurement_date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric(5,2),
  body_fat_percentage numeric(4,1),
  muscle_mass numeric(5,2),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  arms_cm numeric(5,1),
  thighs_cm numeric(5,1),
  progress_photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Achievement badges table
CREATE TABLE IF NOT EXISTS achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  icon_url text,
  points_required integer,
  criteria jsonb NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('streak', 'milestone', 'challenge', 'social')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  badge_id uuid REFERENCES achievement_badges(id) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress_data jsonb,
  UNIQUE(user_id, badge_id)
);

-- Weekly reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  meals_completed integer DEFAULT 0,
  workouts_completed integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  average_calories numeric(7,2),
  weight_change numeric(4,1),
  goal_progress_percentage numeric(5,2),
  achievements_earned integer DEFAULT 0,
  report_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- User goals policies
CREATE POLICY "Users can manage own goals"
  ON user_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Progress measurements policies
CREATE POLICY "Users can manage own measurements"
  ON progress_measurements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievement badges policies (public read)
CREATE POLICY "Everyone can read achievement badges"
  ON achievement_badges
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Weekly reports policies
CREATE POLICY "Users can read own reports"
  ON weekly_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_goals_user_active ON user_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_progress_measurements_user_date ON progress_measurements(user_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_week ON weekly_reports(user_id, week_start_date);

-- Insert some default achievement badges
INSERT INTO achievement_badges (name, description, points_required, criteria, badge_type) VALUES
('First Steps', 'Complete your first meal tracking', 25, '{"meals_completed": 1}', 'milestone'),
('Week Warrior', 'Complete all meals for 7 consecutive days', 175, '{"consecutive_days": 7}', 'streak'),
('Point Collector', 'Earn 1000 total points', 1000, '{"total_points": 1000}', 'milestone'),
('Consistency King', 'Track meals for 30 consecutive days', 750, '{"consecutive_days": 30}', 'streak'),
('Workout Warrior', 'Complete 10 workouts', 500, '{"workouts_completed": 10}', 'milestone')
ON CONFLICT (name) DO NOTHING;