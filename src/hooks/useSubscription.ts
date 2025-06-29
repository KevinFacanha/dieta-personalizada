import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Plan, Subscription, UserLimits } from '../types/subscription';

export function useSubscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message);
    }
  }, []);

  const fetchUserSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar assinatura ativa
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      setCurrentSubscription(subscription);

      // Buscar limites do usuário
      const { data: limits, error: limitsError } = await supabase
        .from('user_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (limitsError && limitsError.code !== 'PGRST116') throw limitsError;

      if (!limits) {
        // Criar limites padrão para usuário free usando upsert
        const { data: newLimits, error: createError } = await supabase
          .from('user_limits')
          .upsert(
            {
              user_id: user.id,
              plan: 'Free'
            },
            { 
              onConflict: 'user_id' 
            }
          )
          .select()
          .single();

        if (createError) throw createError;
        setUserLimits(newLimits);
      } else {
        setUserLimits(limits);
      }

    } catch (err: any) {
      console.error('Error fetching user subscription:', err);
      setError(err.message);
    }
  }, []);

  const cancelSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentSubscription) return;

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      // Atualizar limites para plano free
      const { error: limitsError } = await supabase
        .from('user_limits')
        .update({ 
          plan: 'Free',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (limitsError) throw limitsError;

      await fetchUserSubscription();
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      throw err;
    }
  }, [currentSubscription, fetchUserSubscription]);

  const getCurrentPlan = useCallback(() => {
    if (!currentSubscription) return 'Free';
    return userLimits?.plan || 'Free';
  }, [currentSubscription, userLimits]);

  const hasFeature = useCallback((feature: string) => {
    const currentPlan = getCurrentPlan();
    
    const features: Record<string, string[]> = {
      Free: ['basic_meals', 'weekly_view'],
      Pro: ['basic_meals', 'weekly_view', 'food_customization', 'history'],
      Plus: ['basic_meals', 'weekly_view', 'food_customization', 'history', 'points_system', 'rewards', 'nutritionist_support']
    };

    return features[currentPlan]?.includes(feature) || false;
  }, [getCurrentPlan]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPlans(), fetchUserSubscription()]);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchPlans, fetchUserSubscription]);

  return {
    plans,
    currentSubscription,
    userLimits,
    loading,
    error,
    cancelSubscription,
    getCurrentPlan,
    hasFeature,
    refetch: fetchUserSubscription
  };
}