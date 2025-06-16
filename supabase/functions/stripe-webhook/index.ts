import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14.15.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(`Webhook error: ${error.message}`, { status: 400 })
  }
})

async function handleCustomerCreated(customer: Stripe.Customer) {
  const userId = customer.metadata?.supabase_user_id
  if (!userId) return

  await supabase.from('stripe_customers').upsert({
    id: parseInt(customer.id.replace('cus_', ''), 36),
    user_id: userId,
    customer_id: customer.id,
    created_at: new Date(customer.created * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planName = session.metadata?.plan_name

  if (!userId || !planName) return

  // Create order record
  await supabase.from('stripe_orders').insert({
    id: parseInt(session.id.replace('cs_', ''), 36),
    checkout_session_id: session.id,
    payment_intent_id: session.payment_intent as string,
    customer_id: session.customer as string,
    amount_subtotal: session.amount_subtotal || 0,
    amount_total: session.amount_total || 0,
    currency: session.currency || 'brl',
    payment_status: session.payment_status,
    status: 'completed',
  })

  // Update user limits
  await supabase.from('user_limits').upsert({
    user_id: userId,
    plan: planName,
    meal_plans_used: 0,
    food_edits_used: 0,
    gamification_missions_used: 0,
    workouts_used: 0,
    reset_date: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString(),
  })
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  const priceId = subscription.items.data[0]?.price.id
  const planName = getPlanNameFromPriceId(priceId)

  await supabase.from('stripe_subscriptions').upsert({
    id: parseInt(subscription.id.replace('sub_', ''), 36),
    customer_id: subscription.customer as string,
    subscription_id: subscription.id,
    price_id: priceId,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    status: subscription.status as any,
    updated_at: new Date().toISOString(),
  })

  // Create or update subscription record
  const { data: plan } = await supabase
    .from('plans')
    .select('id')
    .eq('name', planName)
    .single()

  if (plan) {
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_id: plan.id,
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  // Update user limits
  await supabase.from('user_limits').upsert({
    user_id: userId,
    plan: planName,
    updated_at: new Date().toISOString(),
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  if (!userId) return

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Downgrade to free plan
  await supabase.from('user_limits').upsert({
    user_id: userId,
    plan: 'Free',
    updated_at: new Date().toISOString(),
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Payment succeeded for invoice: ${invoice.id}`)
  // Add any additional logic for successful payments
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`)
  // Add logic to handle failed payments (e.g., send notification)
}

function getPlanNameFromPriceId(priceId: string): string {
  const priceMapping: Record<string, string> = {
    'price_1234567890': 'Pro',
    'price_0987654321': 'Plus',
  }
  return priceMapping[priceId] || 'Free'
}