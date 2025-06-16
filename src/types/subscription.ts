export interface Plan {
  id: string;
  name: 'Free' | 'Pro' | 'Plus';
  description: string;
  price: number;
  duration_months: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserLimits {
  id: string;
  user_id: string;
  plan: string;
  meal_plans_used: number;
  food_edits_used: number;
  gamification_missions_used: number;
  workouts_used: number;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface StripeCustomer {
  id: number;
  user_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface StripeSubscription {
  id: number;
  customer_id: string;
  subscription_id?: string;
  price_id?: string;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end: boolean;
  payment_method_brand?: string;
  payment_method_last4?: string;
  status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PlanLimits {
  Free: {
    meals_per_day: 3;
    weekly_view: true;
    points_system: false;
    history: false;
    nutritionist_support: false;
    rewards: false;
    food_customization: false;
  };
  Pro: {
    meals_per_day: 5;
    weekly_view: true;
    points_system: false;
    history: true;
    nutritionist_support: false;
    rewards: false;
    food_customization: true;
  };
  Plus: {
    meals_per_day: 5;
    weekly_view: true;
    points_system: true;
    history: true;
    nutritionist_support: true;
    rewards: true;
    food_customization: true;
  };
}

export const PLAN_LIMITS: PlanLimits = {
  Free: {
    meals_per_day: 3,
    weekly_view: true,
    points_system: false,
    history: false,
    nutritionist_support: false,
    rewards: false,
    food_customization: false,
  },
  Pro: {
    meals_per_day: 5,
    weekly_view: true,
    points_system: false,
    history: true,
    nutritionist_support: false,
    rewards: false,
    food_customization: true,
  },
  Plus: {
    meals_per_day: 5,
    weekly_view: true,
    points_system: true,
    history: true,
    nutritionist_support: true,
    rewards: true,
    food_customization: true,
  },
};