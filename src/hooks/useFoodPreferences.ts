import { useState, useCallback } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import type { FoodPreferences } from '../types';

export function useFoodPreferences() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveFoodPreferences = useCallback(async (userId: string, preferences: FoodPreferences) => {
    try {
      setLoading(true);
      setError(null);

      // Verifica se já existe um registro
      const { data: existingPrefs, error: checkError } = await withRetry(
        () => supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
      );

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPrefs) {
        // Atualiza o registro existente
        const { error: updateError } = await withRetry(
          () => supabase
            .from('user_preferences')
            .update({
              preferences,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
        );

        if (updateError) throw updateError;
      } else {
        // Cria um novo registro
        const { error: insertError } = await withRetry(
          () => supabase
            .from('user_preferences')
            .insert([{
              user_id: userId,
              preferences,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
        );

        if (insertError) throw insertError;
      }

    } catch (err: any) {
      console.error('Error saving food preferences:', err);
      setError(err?.message || 'Falha ao salvar preferências alimentares');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFoodPreferences = useCallback(async (userId: string): Promise<FoodPreferences | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await withRetry(
        () => supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .maybeSingle()
      );

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.preferences || null;

    } catch (err: any) {
      console.error('Error loading food preferences:', err);
      setError(err?.message || 'Falha ao carregar preferências alimentares');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    saveFoodPreferences,
    loadFoodPreferences
  };
}