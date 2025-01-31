import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useResetPoints() {
  useEffect(() => {
    const resetPoints = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) return;

        // Primeiro verifica se já existe um registro para o usuário
        const { data: existingPoints } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPoints) {
          // Se existe, atualiza
          await supabase
            .from('user_points')
            .update({
              points: 0,
              free_weekly_meals: 0,
              last_week_reset: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        } else {
          // Se não existe, insere
          await supabase
            .from('user_points')
            .insert([{
              user_id: user.id,
              points: 0,
              free_weekly_meals: 0,
              last_week_reset: new Date().toISOString()
            }]);
        }

        // Limpa o histórico de refeições
        await supabase
          .from('meal_history')
          .delete()
          .eq('user_id', user.id);

      } catch (err) {
        console.error('Error resetting points:', err);
      }
    };

    resetPoints();
  }, []); // Executa apenas uma vez ao montar o componente
}