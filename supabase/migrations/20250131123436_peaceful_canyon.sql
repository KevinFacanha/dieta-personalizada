/*
  # Correção da estrutura de preferências alimentares

  1. Alterações
    - Adiciona validação para garantir que as preferências são salvas corretamente
    - Adiciona índice para melhor performance
    - Garante que a estrutura JSON está correta
    - Adiciona trigger para atualização automática de timestamp

  2. Segurança
    - Mantém as políticas RLS existentes
*/

-- Garante que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{"carbs": [], "proteins": [], "fruits": []}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilita RLS se ainda não estiver habilitado
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Garante que as políticas existem
DO $$ 
BEGIN
  -- Política de leitura
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'Users can read own preferences'
  ) THEN
    CREATE POLICY "Users can read own preferences"
      ON user_preferences
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Política de atualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'Users can update own preferences'
  ) THEN
    CREATE POLICY "Users can update own preferences"
      ON user_preferences
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política de inserção
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences"
      ON user_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Adiciona validação para a estrutura JSON
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

-- Adiciona índice para melhor performance
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

-- Cria função para atualização automática de timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para atualização automática de timestamp
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