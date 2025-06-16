import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  planName: 'Pro' | 'Plus';
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { planName, userId, userEmail, successUrl, cancelUrl }: RequestBody = await req.json()

    // Define price IDs for each plan
    const priceIds = {
      Pro: 'price_1234567890', // Replace with your actual Stripe price ID
      Plus: 'price_0987654321', // Replace with your actual Stripe price ID
    }

    const priceId = priceIds[planName]
    if (!priceId) {
      throw new Error(`Invalid plan: ${planName}`)
    }

    // Create or retrieve customer
    let customer
    try {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      })
      
      if (customers.data.length > 0) {
        customer = customers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            supabase_user_id: userId,
          },
        })
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error)
      throw new Error('Failed to create customer')
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_name: planName,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_name: planName,
        },
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})