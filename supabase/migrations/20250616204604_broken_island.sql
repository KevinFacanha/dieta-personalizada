/*
  # Sistema de Assinatura com Stripe

  1. New Tables
    - `plans` - Planos de assinatura disponíveis
    - `subscriptions` - Assinaturas dos usuários
    - `user_limits` - Limites de uso por plano
    - `logs` - Log de eventos do sistema

  2. Stripe Tables (já existem, mas adicionamos se necessário)
    - `stripe_customers` - Clientes Stripe
    - `stripe_subscriptions` - Assinaturas Stripe
    - `stripe_orders` - Pedidos Stripe

  3. Security
    - Enable RLS em todas as tabelas
    - Políticas para acesso seguro aos dados
    - Views para facilitar consultas Stripe

  4. Features
    - Planos Free, Pro e Plus
    - Controle de limites por usuário
    - Integração completa com Stripe
*/

-- Criar tipos apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_subscription_status') THEN
    CREATE TYPE stripe_subscription_status AS ENUM (
      'not_started',
      'incomplete',
      'incomplete_expired', 
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stripe_order_status') THEN
    CREATE TYPE stripe_order_status AS ENUM (
      'pending',
      'completed',
      'canceled'
    );
  END IF;
END $$;

-- Tabela de planos
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL,
  duration_months integer NOT NULL,
  features jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de limites por usuário
CREATE TABLE IF NOT EXISTS user_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  plan text NOT NULL,
  meal_plans_used integer DEFAULT 0,
  food_edits_used integer DEFAULT 0,
  gamification_missions_used integer DEFAULT 0,
  workouts_used integer DEFAULT 0,
  reset_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Verificar e criar tabelas Stripe se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_customers') THEN
    CREATE TABLE stripe_customers (
      id bigint PRIMARY KEY,
      user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
      customer_id text NOT NULL UNIQUE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted_at timestamptz
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_subscriptions') THEN
    CREATE TABLE stripe_subscriptions (
      id bigint PRIMARY KEY,
      customer_id text NOT NULL UNIQUE,
      subscription_id text,
      price_id text,
      current_period_start bigint,
      current_period_end bigint,
      cancel_at_period_end boolean DEFAULT false,
      payment_method_brand text,
      payment_method_last4 text,
      status stripe_subscription_status NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted_at timestamptz
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stripe_orders') THEN
    CREATE TABLE stripe_orders (
      id bigint PRIMARY KEY,
      checkout_session_id text NOT NULL,
      payment_intent_id text NOT NULL,
      customer_id text NOT NULL,
      amount_subtotal bigint NOT NULL,
      amount_total bigint NOT NULL,
      currency text NOT NULL,
      payment_status text NOT NULL,
      status stripe_order_status DEFAULT 'pending' NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted_at timestamptz
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;

-- Policies para plans (público)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'plans' 
    AND policyname = 'Public plans are viewable by everyone'
  ) THEN
    CREATE POLICY "Public plans are viewable by everyone"
      ON plans
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Policies para subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Users can view own subscription'
  ) THEN
    CREATE POLICY "Users can view own subscription"
      ON subscriptions
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies para user_limits
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_limits' 
    AND policyname = 'Users can read own limits'
  ) THEN
    CREATE POLICY "Users can read own limits"
      ON user_limits
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_limits' 
    AND policyname = 'Users can update own limits'
  ) THEN
    CREATE POLICY "Users can update own limits"
      ON user_limits
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policies para Stripe tables (verificar se já existem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' 
    AND policyname = 'Users can view their own customer data'
  ) THEN
    CREATE POLICY "Users can view their own customer data"
      ON stripe_customers
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_customers' 
    AND policyname = 'view_own_customer_data'
  ) THEN
    CREATE POLICY "view_own_customer_data"
      ON stripe_customers
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id AND deleted_at IS NULL);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_subscriptions' 
    AND policyname = 'Users can view their own subscription data'
  ) THEN
    CREATE POLICY "Users can view their own subscription data"
      ON stripe_subscriptions
      FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT customer_id FROM stripe_customers 
          WHERE user_id = auth.uid() AND deleted_at IS NULL
        ) AND deleted_at IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_subscriptions' 
    AND policyname = 'view_own_subscription_data'
  ) THEN
    CREATE POLICY "view_own_subscription_data"
      ON stripe_subscriptions
      FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT customer_id FROM stripe_customers 
          WHERE user_id = auth.uid() AND deleted_at IS NULL
        ) AND deleted_at IS NULL
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_orders' 
    AND policyname = 'Users can view their own order data'
  ) THEN
    CREATE POLICY "Users can view their own order data"
      ON stripe_orders
      FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT customer_id FROM stripe_customers 
          WHERE user_id = auth.uid() AND deleted_at IS NULL
        ) AND deleted_at IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_orders' 
    AND policyname = 'view_own_order_data'
  ) THEN
    CREATE POLICY "view_own_order_data"
      ON stripe_orders
      FOR SELECT
      TO authenticated
      USING (
        customer_id IN (
          SELECT customer_id FROM stripe_customers 
          WHERE user_id = auth.uid() AND deleted_at IS NULL
        ) AND deleted_at IS NULL
      );
  END IF;
END $$;

-- Indexes (criar apenas se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'subscriptions' 
    AND indexname = 'idx_subscriptions_user_id'
  ) THEN
    CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'subscriptions' 
    AND indexname = 'idx_subscriptions_status'
  ) THEN
    CREATE INDEX idx_subscriptions_status ON subscriptions(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'logs' 
    AND indexname = 'idx_logs_event'
  ) THEN
    CREATE INDEX idx_logs_event ON logs(event);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'logs' 
    AND indexname = 'idx_logs_created_at'
  ) THEN
    CREATE INDEX idx_logs_created_at ON logs(created_at);
  END IF;
END $$;

-- Triggers para updated_at (verificar se função já existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_plans_updated_at'
  ) THEN
    CREATE TRIGGER update_plans_updated_at
      BEFORE UPDATE ON plans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Inserir planos padrão (apenas se não existirem)
INSERT INTO plans (name, description, price, duration_months, features) VALUES
('Free', 'Acesso básico com 3 refeições diárias', 0.00, 1, '["3 refeições diárias", "Visualização da dieta semanal"]'),
('Pro', 'Plano completo com personalização', 19.90, 1, '["Plano completo", "Personalização de refeições", "Suporte prioritário"]'),
('Plus', 'Plano premium com todos os recursos', 39.90, 1, '["Modo de pontos", "Histórico completo", "Suporte ao nutricionista", "Recompensas", "Análises avançadas"]')
ON CONFLICT (name) DO NOTHING;

-- Views para facilitar consultas Stripe (recriar se necessário)
CREATE OR REPLACE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE sc.deleted_at IS NULL AND (ss.deleted_at IS NULL OR ss.deleted_at IS NULL);

CREATE OR REPLACE VIEW stripe_user_orders AS
SELECT 
  sc.customer_id,
  so.id as order_id,
  so.checkout_session_id,
  so.payment_intent_id,
  so.amount_subtotal,
  so.amount_total,
  so.currency,
  so.payment_status,
  so.status as order_status,
  so.created_at as order_date
FROM stripe_customers sc
LEFT JOIN stripe_orders so ON sc.customer_id = so.customer_id
WHERE sc.deleted_at IS NULL AND (so.deleted_at IS NULL OR so.deleted_at IS NULL);