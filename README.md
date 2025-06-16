# Dieta Personalizada - Stripe Integration

## 🚀 Configuração do Stripe

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as seguintes variáveis:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Configurar Produtos no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá para **Produtos** e crie dois produtos:
   - **Plano Pro** - R$ 19,90/mês
   - **Plano Plus** - R$ 39,90/mês
3. Copie os Price IDs e atualize em `src/lib/stripe.ts`

### 3. Configurar Webhooks

1. No Dashboard do Stripe, vá para **Webhooks**
2. Adicione um endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Selecione os eventos:
   - `customer.created`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o webhook secret e adicione ao `.env`

### 4. Deploy das Edge Functions

```bash
# Deploy das funções do Stripe
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

### 5. Configurar Secrets no Supabase

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## 🔧 Funcionalidades Implementadas

### ✅ Checkout com Stripe
- Criação de sessões de checkout
- Redirecionamento automático para Stripe
- Páginas de sucesso e cancelamento

### ✅ Portal do Cliente
- Gerenciamento de assinaturas
- Atualização de métodos de pagamento
- Histórico de faturas

### ✅ Webhooks
- Sincronização automática com banco de dados
- Atualização de status de assinatura
- Controle de acesso baseado no plano

### ✅ Controle de Acesso
- Restrições baseadas no plano
- Modais de upgrade automáticos
- Limites de recursos por plano

## 📋 Planos Disponíveis

### Free (Gratuito)
- 3 refeições diárias
- Visualização da dieta semanal

### Pro (R$ 19,90/mês)
- 5 refeições diárias
- Personalização de refeições
- Histórico completo
- Suporte prioritário

### Plus (R$ 39,90/mês)
- Todos os recursos do Pro
- Sistema de pontos
- Recompensas
- Suporte ao nutricionista
- Análises avançadas

## 🔄 Fluxo de Pagamento

1. **Usuário seleciona plano** → Clica em "Assinar"
2. **Criação da sessão** → Edge function cria checkout session
3. **Redirecionamento** → Usuário vai para Stripe Checkout
4. **Pagamento** → Usuário completa pagamento
5. **Webhook** → Stripe notifica nossa aplicação
6. **Atualização** → Banco de dados é atualizado
7. **Acesso liberado** → Usuário tem acesso aos recursos

## 🛠️ Desenvolvimento

### Testar Webhooks Localmente

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Em outro terminal, executar testes
stripe trigger checkout.session.completed
```

### Logs e Debug

```bash
# Ver logs das edge functions
supabase functions logs stripe-webhook
```

## 🔒 Segurança

- Todas as chaves secretas são armazenadas no Supabase Secrets
- Webhooks são verificados com assinatura
- RLS (Row Level Security) protege dados dos usuários
- Validação de dados em todas as operações

## 📱 Componentes Principais

- `StripeCheckoutButton` - Botão para iniciar checkout
- `StripePortalButton` - Acesso ao portal do cliente
- `SubscriptionPlans` - Exibição dos planos
- `PlanUpgradeModal` - Modal para upgrade
- `SuccessPage` - Página de confirmação
- `CancelPage` - Página de cancelamento

## 🚀 Deploy

1. Configure as variáveis de ambiente
2. Deploy das edge functions
3. Configure webhooks no Stripe
4. Teste o fluxo completo

O sistema está pronto para produção! 🎉