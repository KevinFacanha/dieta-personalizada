/*
  # Add INSERT policy for user_limits table

  1. Security
    - Add policy for authenticated users to insert their own user limits
    - This allows the application to create default user_limits entries for new users

  The policy ensures users can only insert records where the user_id matches their authenticated user ID.
*/

CREATE POLICY "Users can insert own limits"
  ON user_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);