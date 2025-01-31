import { useState, useEffect, useCallback } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { AuthState, DailyMeals } from '../types';

export function usePoints(auth: AuthState) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeUserPoints = useCallback(async () => {
    if (!auth.user?.email) return;

    try {
      const { data: { user }, error: authError } = await withRetry(
        () => supabase.auth.getUser(),
        3,
        1000,
        false // Não usar delay exponencial para auth
      );
      
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      // Primeiro tenta obter pontos existentes
      const { data: existingPoints, error: fetchError } = await withRetry(() =>
        supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      );

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Se não existem pontos, cria um novo registro
      if (!existingPoints) {
        const { data: newPoints, error: insertError } = await withRetry(() =>
          supabase
            .from('user_points')
            .insert([
              {
                user_id: user.id,
                points: 0,
                free_weekly_meals: 0,
                last_week_reset: new Date().toISOString()
              }
            ])
            .select()
            .single()
        );

        if (insertError) throw insertError;

        auth.user.points = 0;
        auth.user.freeWeeklyMeals = 0;
      } else {
        auth.user.points = existingPoints.points;
        auth.user.freeWeeklyMeals = existingPoints.free_weekly_meals;
      }

      // Carrega histórico de refeições
      const { data: mealHistory, error: historyError } = await withRetry(() =>
        supabase
          .from('meal_history')
          .select('*')
          .eq('user_id', user.id)
      );

      if (historyError) throw historyError;

      if (mealHistory) {
        const formattedHistory: Record<string, DailyMeals> = {};
        mealHistory.forEach(record => {
          formattedHistory[record.date] = {
            breakfast: record.breakfast,
            morningSnack: record.morning_snack,
            lunch: record.lunch,
            afternoonSnack: record.afternoon_snack,
            dinner: record.dinner
          };
        });
        auth.user.mealHistory = formattedHistory;
      }

    } catch (err: any) {
      console.error('Error initializing user points:', err);
      setError(err?.message || 'Falha ao inicializar pontos do usuário');
      
      // Se for erro de autenticação, limpa o estado
      if (err?.status === 401 || err?.status === 403) {
        auth.isAuthenticated = false;
        auth.user = null;
      }
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    initializeUserPoints();
  }, [initializeUserPoints]);

  const updatePoints = async (newPoints: number) => {
    if (!auth.user?.email) return;

    try {
      const { data: { user }, error: authError } = await withRetry(() =>
        supabase.auth.getUser()
      );
      
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      const { error } = await withRetry(() =>
        supabase
          .from('user_points')
          .update({ points: newPoints, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      );

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating points:', err);
      throw new Error(err?.message || 'Falha ao atualizar pontos');
    }
  };

  const updateFreeWeeklyMeals = async (meals: number) => {
    if (!auth.user?.email) return;

    try {
      const { data: { user }, error: authError } = await withRetry(() =>
        supabase.auth.getUser()
      );
      
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      const { error } = await withRetry(() =>
        supabase
          .from('user_points')
          .update({
            free_weekly_meals: meals,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      );

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating free weekly meals:', err);
      throw new Error(err?.message || 'Falha ao atualizar refeições livres');
    }
  };

  const recordMeal = async (mealType: keyof DailyMeals, date: string) => {
    if (!auth.user?.email) return;

    try {
      const { data: { user }, error: authError } = await withRetry(() =>
        supabase.auth.getUser()
      );
      
      if (authError) throw authError;
      if (!user) throw new Error('No authenticated user found');

      const mealTypeMap: Record<keyof DailyMeals, string> = {
        breakfast: 'breakfast',
        morningSnack: 'morning_snack',
        lunch: 'lunch',
        afternoonSnack: 'afternoon_snack',
        dinner: 'dinner'
      };

      const dbMealType = mealTypeMap[mealType];

      const { data: existingRecord, error: fetchError } = await withRetry(() =>
        supabase
          .from('meal_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .maybeSingle()
      );

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingRecord) {
        const { error: updateError } = await withRetry(() =>
          supabase
            .from('meal_history')
            .update({
              [dbMealType]: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRecord.id)
        );

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await withRetry(() =>
          supabase
            .from('meal_history')
            .insert([{
              user_id: user.id,
              date,
              [dbMealType]: true
            }])
        );

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Error recording meal:', err);
      throw new Error(err?.message || 'Falha ao registrar refeição');
    }
  };

  return {
    loading,
    error,
    updatePoints,
    updateFreeWeeklyMeals,
    recordMeal,
    retry: initializeUserPoints // Expose retry function
  };
}