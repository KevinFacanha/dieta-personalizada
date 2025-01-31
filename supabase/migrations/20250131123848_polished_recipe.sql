/*
  # Sistema de Pontos e Recompensas

  1. Alterações
    - Adiciona coluna `total_points_earned` na tabela `user_points` para rastrear pontos totais
    - Adiciona coluna `points_history` para armazenar histórico detalhado
    - Adiciona coluna `redeemed_meals` para rastrear refeições resgatadas

  2. Segurança
    - Mantém as políticas RLS existentes
    - Adiciona validação para novos campos JSON

  3. Performance
    - Adiciona índices para consultas frequentes
*/

-- Adiciona novas colunas à tabela user_points
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_points' AND column_name = 'total_points_earned'
  ) THEN
    ALTER TABLE user_points 
    ADD COLUMN total_points_earned integer DEFAULT 0,
    ADD COLUMN points_history jsonb DEFAULT '[]',
    ADD COLUMN redeemed_meals jsonb DEFAULT '[]';
  END IF;
END $$;

-- Adiciona validação para estrutura do histórico de pontos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'points_history_valid_json'
  ) THEN
    ALTER TABLE user_points
    ADD CONSTRAINT points_history_valid_json
    CHECK (
      jsonb_typeof(points_history) = 'array' AND
      (
        SELECT bool_and(
          value ? 'points' AND
          value ? 'date' AND
          value ? 'type' AND
          jsonb_typeof(value->'points') = 'number' AND
          jsonb_typeof(value->'date') = 'string' AND
          jsonb_typeof(value->'type') = 'string'
        )
        FROM jsonb_array_elements(COALESCE(points_history, '[]'::jsonb))
      )
    );
  END IF;
END $$;

-- Adiciona validação para estrutura de refeições resgatadas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'redeemed_meals_valid_json'
  ) THEN
    ALTER TABLE user_points
    ADD CONSTRAINT redeemed_meals_valid_json
    CHECK (
      jsonb_typeof(redeemed_meals) = 'array' AND
      (
        SELECT bool_and(
          value ? 'name' AND
          value ? 'points' AND
          value ? 'date' AND
          jsonb_typeof(value->'name') = 'string' AND
          jsonb_typeof(value->'points') = 'number' AND
          jsonb_typeof(value->'date') = 'string'
        )
        FROM jsonb_array_elements(COALESCE(redeemed_meals, '[]'::jsonb))
      )
    );
  END IF;
END $$;

-- Adiciona índices para melhor performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_points' 
    AND indexname = 'idx_user_points_total_earned'
  ) THEN
    CREATE INDEX idx_user_points_total_earned 
    ON user_points(total_points_earned);
  END IF;
END $$;

-- Função para atualizar pontos e histórico
CREATE OR REPLACE FUNCTION update_points_and_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza total_points_earned se os pontos aumentaram
  IF NEW.points > OLD.points THEN
    NEW.total_points_earned = OLD.total_points_earned + (NEW.points - OLD.points);
    
    -- Adiciona entrada no histórico
    NEW.points_history = OLD.points_history || jsonb_build_object(
      'points', NEW.points - OLD.points,
      'date', CURRENT_TIMESTAMP,
      'type', 'earned'
    );
  END IF;

  -- Se os pontos diminuíram (resgate), registra no histórico
  IF NEW.points < OLD.points THEN
    NEW.points_history = OLD.points_history || jsonb_build_object(
      'points', OLD.points - NEW.points,
      'date', CURRENT_TIMESTAMP,
      'type', 'redeemed'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria trigger para atualização automática do histórico
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_points_history_trigger'
  ) THEN
    CREATE TRIGGER update_points_history_trigger
    BEFORE UPDATE OF points ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_points_and_history();
  END IF;
END $$;