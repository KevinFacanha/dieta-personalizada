/*
  # Sistema de Preferências Alimentares

  1. Nova Tabela
    - `user_preferences`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência para auth.users)
      - `preferences` (jsonb, armazena as preferências)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilita RLS na tabela
    - Adiciona políticas para leitura, atualização e inserção
    - Restringe acesso aos próprios dados do usuário

  3. Validações
    - Adiciona constraint para estrutura JSON válida
    - Garante que os campos necessários existem
*/

-- Criar tabela de preferências se não existir
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{"carbs": [], "proteins": [], "fruits": []}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Adicionar validação para estrutura JSON
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

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
ON user_preferences(user_id);

-- Criar função para atualização automática do timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualização automática do timestamp
CREATE TRIGGER set_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_timestamp();