import { supabase } from '../lib/supabase';

export async function useTestLogin() {
  try {
    // Primeiro, faz login com o usuário de teste
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@email.com',
      password: '123456'
    });

    if (authError) throw authError;
    if (!user) throw new Error('No user found');

    // Reseta os pontos e refeições livres
    const { error: resetError } = await supabase
      .from('user_points')
      .upsert({
        user_id: user.id,
        points: 0,
        free_weekly_meals: 0,
        last_week_reset: new Date().toISOString()
      });

    if (resetError) throw resetError;

    // Limpa o histórico de refeições
    const { error: deleteError } = await supabase
      .from('meal_history')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return {
      email: 'teste@email.com',
      name: 'Usuário Teste',
      points: 0,
      freeWeeklyMeals: 0,
      lastWeekReset: new Date().toISOString(),
      mealHistory: {}
    };
  } catch (err) {
    console.error('Error in test login:', err);
    throw err;
  }
}