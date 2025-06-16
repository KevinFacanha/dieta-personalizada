/*
  # Social Features and Community System

  1. New Tables
    - `user_connections` - Friend/follower relationships
    - `community_challenges` - Group challenges and competitions
    - `challenge_participants` - User participation in challenges
    - `social_posts` - User posts and updates
    - `post_reactions` - Likes, comments on posts

  2. Security
    - Enable RLS on all tables
    - Add policies for social interactions

  3. Features
    - Friend system
    - Community challenges
    - Social feed and interactions
*/

-- User connections (friends/followers)
CREATE TABLE IF NOT EXISTS user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) NOT NULL,
  following_id uuid REFERENCES auth.users(id) NOT NULL,
  connection_type text NOT NULL DEFAULT 'follow' CHECK (connection_type IN ('follow', 'friend')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Community challenges
CREATE TABLE IF NOT EXISTS community_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('meal_streak', 'workout_count', 'points_total', 'weight_loss', 'custom')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  max_participants integer,
  entry_fee_points integer DEFAULT 0,
  prize_points integer DEFAULT 0,
  challenge_rules jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES community_challenges(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  joined_at timestamptz DEFAULT now(),
  current_progress jsonb DEFAULT '{}',
  final_score numeric(10,2),
  rank integer,
  completed boolean DEFAULT false,
  UNIQUE(challenge_id, user_id)
);

-- Social posts
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'update' CHECK (post_type IN ('update', 'achievement', 'progress', 'meal', 'workout')),
  media_urls text[],
  tags text[],
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post reactions (likes, comments)
CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'support', 'comment')),
  content text, -- For comments
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- User connections policies
CREATE POLICY "Users can read connections involving them"
  ON user_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create connections"
  ON user_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update their connections"
  ON user_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id)
  WITH CHECK (auth.uid() = follower_id OR auth.uid() = following_id);

-- Community challenges policies
CREATE POLICY "Everyone can read active challenges"
  ON community_challenges
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create challenges"
  ON community_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges"
  ON community_challenges
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Challenge participants policies
CREATE POLICY "Users can read challenge participants"
  ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join challenges"
  ON challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation"
  ON challenge_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Social posts policies
CREATE POLICY "Users can read public posts and friend posts"
  ON social_posts
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR 
    auth.uid() = user_id OR
    (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM user_connections 
      WHERE follower_id = auth.uid() 
      AND following_id = social_posts.user_id 
      AND status = 'accepted'
    ))
  );

CREATE POLICY "Users can create their own posts"
  ON social_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON social_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON social_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post reactions policies
CREATE POLICY "Users can read reactions on visible posts"
  ON post_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM social_posts 
      WHERE id = post_reactions.post_id 
      AND (
        visibility = 'public' OR 
        user_id = auth.uid() OR
        (visibility = 'friends' AND EXISTS (
          SELECT 1 FROM user_connections 
          WHERE follower_id = auth.uid() 
          AND following_id = social_posts.user_id 
          AND status = 'accepted'
        ))
      )
    )
  );

CREATE POLICY "Users can create reactions"
  ON post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON post_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON post_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_connections_follower ON user_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_following ON user_connections(following_id);
CREATE INDEX IF NOT EXISTS idx_community_challenges_active ON community_challenges(is_active, start_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON social_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_visibility ON social_posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);