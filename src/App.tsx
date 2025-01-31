import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, Activity, Clock, Utensils, RefreshCw, ChevronRight } from 'lucide-react';
import UserForm from './components/UserForm';
import DietPlan from './components/DietPlan';
import Login from './components/Login';
import Register from './components/Register';
import FoodPreferences from './components/FoodPreferences';
import GoalSelection from './components/GoalSelection';
import PointsDisplay from './components/PointsDisplay';
import MealCheckbox from './components/MealCheckbox';
import MealTrackingCalendar from './components/MealTrackingCalendar';
import CelebrationModal from './components/CelebrationModal';
import PreferencesButton from './components/PreferencesButton';
import FoodPreferencesModal from './components/FoodPreferencesModal';
import { calculateBMR, adjustCalories, generateMealPlan, generateRecommendations } from './utils/calculations';
import { usePoints } from './hooks/usePoints';
import { useResetPoints } from './hooks/useResetPoints';
import { useFoodPreferences } from './hooks/useFoodPreferences';
import { supabase } from './lib/supabase';
import type { UserData, DietPlanType, AuthState, FoodPreferences as FoodPreferencesType, RewardMeal, DailyMeals } from './types';

function App() {
  // Auth and UI state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });
  const [showRegister, setShowRegister] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userGoal, setUserGoal] = useState<'muscle' | 'fat_loss' | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlanType | null>(null);

  // Refs
  const dietPlanRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { loading, error, updatePoints, updateFreeWeeklyMeals, recordMeal } = usePoints(auth);
  const { saveFoodPreferences, loadFoodPreferences } = useFoodPreferences();
  
  useResetPoints();

  // Callbacks
  const handleMealComplete = useCallback(async (mealType: keyof DailyMeals, points: number) => {
    if (!auth.user) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      await recordMeal(mealType, today);
      await updatePoints((auth.user.points || 0) + points);

      setAuth(prev => {
        if (!prev.user) return prev;

        const currentHistory = prev.user.mealHistory || {};
        const todayMeals = currentHistory[today] || {
          breakfast: false,
          morningSnack: false,
          lunch: false,
          afternoonSnack: false,
          dinner: false
        };

        if (!todayMeals[mealType]) {
          const updatedMeals = {
            ...todayMeals,
            [mealType]: true
          };

          if (Object.values(updatedMeals).every(meal => meal)) {
            setShowCelebration(true);
          }

          return {
            ...prev,
            user: {
              ...prev.user,
              points: prev.user.points + points,
              mealHistory: {
                ...currentHistory,
                [today]: updatedMeals
              }
            }
          };
        }

        return prev;
      });
    } catch (err) {
      console.error('Error completing meal:', err);
    }
  }, [auth.user, recordMeal, updatePoints]);

  const handleRedeemMeal = useCallback(async (meal: RewardMeal) => {
    if (!auth.user || auth.user.points < meal.points || auth.user.freeWeeklyMeals >= 2) {
      return;
    }

    try {
      await updatePoints(auth.user.points - meal.points);
      await updateFreeWeeklyMeals(auth.user.freeWeeklyMeals + 1);

      setAuth(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          points: prev.user.points - meal.points,
          freeWeeklyMeals: prev.user.freeWeeklyMeals + 1
        } : null
      }));

      alert(`Parabéns! Você resgatou ${meal.name}. Aproveite sua refeição livre!`);
    } catch (err) {
      console.error('Error redeeming meal:', err);
    }
  }, [auth.user, updatePoints, updateFreeWeeklyMeals]);

  const handleSubmit = useCallback((userData: UserData) => {
    if (!auth.user?.preferences || !userGoal) {
      alert('Por favor, complete todas as etapas necessárias');
      return;
    }

    const bmr = calculateBMR(userData);
    const adjustedCalories = adjustCalories(bmr, userData.activityLevel, userData.sleepHours, userGoal);
    const { meals, macroDistribution } = generateMealPlan(adjustedCalories, auth.user.preferences, userGoal);
    
    setDietPlan({
      calories: adjustedCalories,
      meals,
      recommendations: generateRecommendations({ ...userData, goal: userGoal }),
      macroDistribution
    });
  }, [auth.user?.preferences, userGoal]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha incorretos');
        }
        throw new Error('Erro ao fazer login. Por favor, tente novamente.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    }
  }, []);

  const handleRegister = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        if (error.message === 'User already registered') {
          throw new Error('Este email já está cadastrado');
        }
        throw new Error('Erro ao criar conta. Por favor, tente novamente.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    }
  }, []);

  const handlePreferencesComplete = useCallback((preferences: FoodPreferencesType) => {
    setAuth(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        preferences
      } : null
    }));
  }, []);

  const handleClearDiet = useCallback(() => {
    setDietPlan(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuth({
        isAuthenticated: false,
        user: null
      });
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, []);

  const scrollToDiet = useCallback(() => {
    if (window.innerWidth < 1024 && dietPlanRef.current) {
      dietPlanRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Effects
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuth({
            isAuthenticated: true,
            user: {
              email: session.user.email || '',
              name: session.user.user_metadata.name || 'Usuário',
              points: 0,
              freeWeeklyMeals: 0,
              lastWeekReset: new Date().toISOString(),
              mealHistory: {}
            }
          });
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setAuth({
          isAuthenticated: false,
          user: null
        });
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuth({
          isAuthenticated: true,
          user: {
            email: session.user.email || '',
            name: session.user.user_metadata.name || 'Usuário',
            points: 0,
            freeWeeklyMeals: 0,
            lastWeekReset: new Date().toISOString(),
            mealHistory: {}
          }
        });
      } else {
        setAuth({
          isAuthenticated: false,
          user: null
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadUserPreferences() {
      if (!auth.isAuthenticated || !auth.user) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const preferences = await loadFoodPreferences(user.id);
        if (preferences) {
          setAuth(prev => ({
            ...prev,
            user: prev.user ? {
              ...prev.user,
              preferences
            } : null
          }));
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }

    loadUserPreferences();
  }, [auth.isAuthenticated, loadFoodPreferences]);

  useEffect(() => {
    if (auth.user) {
      const today = new Date();
      const lastReset = new Date(auth.user.lastWeekReset);
      const diffDays = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 7) {
        setAuth(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            freeWeeklyMeals: 0,
            lastWeekReset: today.toISOString()
          } : null
        }));
      }
    }
  }, [auth.user?.lastWeekReset]);

  // Render logic
  if (!auth.isAuthenticated) {
    return showRegister ? (
      <Register onRegister={handleRegister} onToggleLogin={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={handleLogin} onToggleRegister={() => setShowRegister(true)} />
    );
  }

  if (!auth.user?.preferences) {
    return <FoodPreferences onComplete={handlePreferencesComplete} />;
  }

  if (!userGoal) {
    return <GoalSelection onSelect={setUserGoal} />;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = auth.user.mealHistory?.[today] || {
    breakfast: false,
    morningSnack: false,
    lunch: false,
    afternoonSnack: false,
    dinner: false
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 flex-1">
              Assistente de Dieta Personalizada
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              {auth.user && (
                <>
                  <PointsDisplay
                    points={auth.user.points}
                    freeWeeklyMeals={auth.user.freeWeeklyMeals}
                    onRedeemMeal={handleRedeemMeal}
                  />
                  <PreferencesButton
                    onClick={() => setShowPreferences(true)}
                  />
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Olá, {auth.user?.name}!
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Crie seu plano alimentar personalizado baseado no seu metabolismo,
            nível de atividade física e padrão de sono.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-4 sm:space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 transition-transform hover:scale-[1.01] duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                  Seus Dados
                </h2>
              </div>
              <UserForm onSubmit={handleSubmit} onDietGenerated={scrollToDiet} />
            </div>

            {auth.user?.mealHistory && (
              <div className="min-h-[500px]">
                <MealTrackingCalendar mealHistory={auth.user.mealHistory} />
              </div>
            )}
          </div>

          {dietPlan && (
            <div ref={dietPlanRef} className="bg-white rounded-xl shadow-lg p-4 sm:p-8 transition-transform hover:scale-[1.01] duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Seu Plano Alimentar
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full sm:w-auto">
                    <MealCheckbox
                      mealName="Café da Manhã"
                      points={25}
                      onComplete={() => handleMealComplete('breakfast', 25)}
                      disabled={todayMeals.breakfast}
                    />
                    <MealCheckbox
                      mealName="Lanche da Manhã"
                      points={25}
                      onComplete={() => handleMealComplete('morningSnack', 25)}
                      disabled={todayMeals.morningSnack}
                    />
                    <MealCheckbox
                      mealName="Almoço"
                      points={50}
                      onComplete={() => handleMealComplete('lunch', 50)}
                      disabled={todayMeals.lunch}
                    />
                    <MealCheckbox
                      mealName="Lanche da Tarde"
                      points={25}
                      onComplete={() => handleMealComplete('afternoonSnack', 25)}
                      disabled={todayMeals.afternoonSnack}
                    />
                    <MealCheckbox
                      mealName="Jantar"
                      points={50}
                      onComplete={() => handleMealComplete('dinner', 50)}
                      disabled={todayMeals.dinner}
                    />
                  </div>
                  <button
                    onClick={handleClearDiet}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
                    title="Limpar dieta"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>
              <DietPlan plan={dietPlan} />
            </div>
          )}
        </div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <FeatureCard
            icon={<Activity />}
            title="Cálculo Preciso"
            description="Baseado no seu gasto energético basal e rotina diária"
          />
          <FeatureCard
            icon={<Clock />}
            title="Ajustes Dinâmicos"
            description="Adaptação conforme suas mudanças de hábitos e preferências"
          />
          <FeatureCard
            icon={<Utensils />}
            title="Refeições Balanceadas"
            description="Sugestões personalizadas e nutritivas para seu dia a dia"
          />
        </div>
      </div>

      {showCelebration && (
        <CelebrationModal onClose={() => setShowCelebration(false)} />
      )}

      {showPreferences && auth.user && (
        <FoodPreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          preferences={auth.user.preferences || { carbs: [], proteins: [], fruits: [] }}
          onSave={async (newPreferences) => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Usuário não autenticado');
              
              await saveFoodPreferences(user.id, newPreferences);
              
              setAuth(prev => ({
                ...prev,
                user: prev.user ? {
                  ...prev.user,
                  preferences: newPreferences
                } : null
              }));
            } catch (err) {
              console.error('Error saving preferences:', err);
              throw err;
            }
          }}
        />
      )}
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer group">
      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
        <div className="text-green-600">
          {icon}
        </div>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-green-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Saiba mais</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );
}

export default App;