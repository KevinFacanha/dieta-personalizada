import type { UserData, FoodPreferences } from '../types';

export function calculateBMR(userData: UserData): number {
  const { weight, height, age, gender } = userData;
  
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

export function adjustCalories(bmr: number, activityLevel: string, sleepHours: number, goal: 'muscle' | 'fat_loss'): number {
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };

  const sleepAdjustment = (sleepHours - 8) * -100;
  const baseCalories = (bmr * activityFactors[activityLevel]) + sleepAdjustment;
  
  if (goal === 'muscle') {
    return baseCalories * 1.15; // Superávit de 15%
  } else {
    return baseCalories * 0.85; // Déficit de 15%
  }
}

export function calculateMacros(calories: number, goal: 'muscle' | 'fat_loss') {
  if (goal === 'muscle') {
    return {
      protein: 0.30,
      carbs: 0.45,
      fats: 0.25
    };
  } else {
    return {
      protein: 0.35,
      carbs: 0.40,
      fats: 0.25
    };
  }
}

export function generateMealPlan(calories: number, preferences: FoodPreferences, goal: 'muscle' | 'fat_loss', mealLimit: number = 5) {
  const macros = calculateMacros(calories, goal);
  const totalProtein = (calories * macros.protein) / 4;
  const totalCarbs = (calories * macros.carbs) / 4;
  const totalFats = (calories * macros.fats) / 9;

  const getTwoRandomOptions = (options: string[]): [string, string] => {
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1] || options[0]];
  };

  const formatPortion = (food: string) => {
    switch (food) {
      case 'Tapioca':
        return '1 unidade média';
      case 'Cuscuz':
        return '1 porção média';
      case 'Aveia':
        return '4 colheres de sopa';
      case 'Ovo':
        return '2 unidades';
      case 'Queijo branco':
        return '2 fatias médias';
      case 'Peito de peru':
        return '3 fatias';
      case 'Queijo cottage':
        return '4 colheres de sopa';
      default:
        return '2 fatias';
    }
  };

  const breakfastCarbs = preferences.carbs.filter(carb => 
    ['Pão francês', 'Pão integral', 'Tapioca', 'Cuscuz', 'Aveia'].includes(carb)
  );
  
  if (breakfastCarbs.length < 2) {
    const defaultOptions = ['Pão integral', 'Tapioca'].filter(opt => !breakfastCarbs.includes(opt));
    breakfastCarbs.push(...defaultOptions.slice(0, 2 - breakfastCarbs.length));
  }

  const breakfastProteins = ['Queijo branco', 'Ovo', 'Peito de peru', 'Queijo cottage'];
  const [carb1, carb2] = getTwoRandomOptions(breakfastCarbs);
  const [protein1, protein2] = getTwoRandomOptions(breakfastProteins);
  const [fruit1, fruit2] = getTwoRandomOptions(preferences.fruits);

  // Base meals (always included)
  const baseMeals = [
    {
      name: 'Café da Manhã (25%)',
      foods: [
        `Opção 1: ${carb1} (${formatPortion(carb1)}) ou ${carb2} (${formatPortion(carb2)})`,
        `Opção 2: ${protein1} (${formatPortion(protein1)}) ou ${protein2} (${formatPortion(protein2)})`,
        `Fruta: ${fruit1} (1 unidade média) ou ${fruit2} (1 unidade média)`,
        'Café com leite desnatado (200ml)',
        goal === 'muscle' ? '1 colher de pasta de amendoim (15g)' : ''
      ].filter(Boolean),
      macros: {
        protein: totalProtein * 0.25,
        carbs: totalCarbs * 0.25,
        fats: totalFats * 0.25
      }
    },
    {
      name: 'Almoço (30%)',
      foods: [
        (() => {
          const [p1, p2] = getTwoRandomOptions(preferences.proteins);
          return `Opção 1: ${goal === 'muscle' ? '200g' : '150g'} de ${p1} ou ${goal === 'muscle' ? '200g' : '150g'} de ${p2}`;
        })(),
        (() => {
          const carbOptions = ['Arroz integral', 'Arroz branco', 'Batata doce', 'Quinoa'];
          const [c1, c2] = getTwoRandomOptions(carbOptions);
          return `Opção 2: ${goal === 'muscle' ? '150g' : '100g'} de ${c1} ou ${goal === 'muscle' ? '150g' : '100g'} de ${c2}`;
        })(),
        'Opção 3: 2 conchas de feijão (100g) ou 1 concha de lentilha (80g)',
        'Opção 4: 2 xícaras de legumes refogados (200g) ou 1 prato de salada verde crua',
        '1 colher de sopa de azeite de oliva (15ml)'
      ],
      macros: {
        protein: totalProtein * 0.30,
        carbs: totalCarbs * 0.30,
        fats: totalFats * 0.30
      }
    },
    {
      name: 'Jantar (15%)',
      foods: [
        (() => {
          const [p1, p2] = getTwoRandomOptions(preferences.proteins);
          return `Opção 1: ${goal === 'muscle' ? '180g' : '120g'} de ${p1} ou ${goal === 'muscle' ? '180g' : '120g'} de ${p2}`;
        })(),
        'Opção 2: Mix de legumes grelhados (200g) ou Legumes no vapor (200g)',
        '1 colher de sopa de azeite de oliva (15ml)',
        goal === 'muscle' 
          ? 'Opção 3: 1 batata doce média assada (150g) ou 1 porção de arroz integral (100g)' 
          : 'Opção 3: 1/2 batata doce média assada (75g) ou 1/2 porção de arroz integral (50g)'
      ],
      macros: {
        protein: totalProtein * 0.15,
        carbs: totalCarbs * 0.15,
        fats: totalFats * 0.15
      }
    }
  ];

  // Additional meals for higher tier plans
  const additionalMeals = [
    {
      name: 'Lanche da Manhã (15%)',
      foods: [
        (() => {
          const [f1, f2] = getTwoRandomOptions(preferences.fruits);
          return `Opção 1: ${f1} (1 unidade média) ou ${f2} (1 unidade média)`;
        })(),
        'Opção 2: 3 colheres de sopa de aveia em flocos ou 2 fatias de pão integral',
        goal === 'muscle' 
          ? 'Opção 3: 1 copo de iogurte natural (200ml) ou 1 scoop de whey protein' 
          : 'Chá verde sem açúcar (200ml)'
      ],
      macros: {
        protein: totalProtein * 0.15,
        carbs: totalCarbs * 0.15,
        fats: totalFats * 0.15
      }
    },
    {
      name: 'Lanche da Tarde (15%)',
      foods: [
        'Opção 1: 1 porção de mix de castanhas (30g) ou 2 colheres de pasta de amendoim (30g)',
        goal === 'muscle' 
          ? 'Opção 2: 1 banana com whey protein ou 1 iogurte grego com granola' 
          : 'Opção 2: 1 fruta média ou 1 iogurte natural',
        'Chá ou café sem açúcar (200ml)'
      ],
      macros: {
        protein: totalProtein * 0.15,
        carbs: totalCarbs * 0.15,
        fats: totalFats * 0.15
      }
    }
  ];

  // Combine meals based on plan limit
  let meals = [...baseMeals];
  if (mealLimit > 3) {
    meals.splice(1, 0, additionalMeals[0]); // Add morning snack after breakfast
    if (mealLimit > 4) {
      meals.splice(3, 0, additionalMeals[1]); // Add afternoon snack after lunch
    }
  }

  return {
    meals,
    macroDistribution: {
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fats: Math.round(totalFats)
    }
  };
}

export function generateRecommendations(userData: UserData): string[] {
  const baseRecommendations = [
    'Mantenha-se hidratado bebendo pelo menos 2L de água por dia',
    'Evite alimentos processados e ricos em açúcares',
    'Faça refeições em horários regulares',
    'Inclua proteínas em todas as refeições principais',
    `Procure dormir ${userData.sleepHours < 7 ? 'mais' : 'pelo menos 7'} horas por noite`,
    'Pratique atividade física regularmente',
    'Priorize alimentos integrais e naturais',
    'Pese os alimentos crus antes do preparo',
    'Use medidores para garantir as porções corretas'
  ];

  const goalSpecificRecommendations = userData.goal === 'muscle' ? [
    'Aumente gradualmente a ingestão de proteínas',
    'Consuma carboidratos complexos antes e após o treino',
    'Mantenha um superávit calórico controlado',
    'Priorize exercícios de força e hipertrofia',
    'Faça refeições a cada 3-4 horas'
  ] : [
    'Mantenha um déficit calórico sustentável',
    'Aumente o consumo de fibras para maior saciedade',
    'Priorize proteínas magras',
    'Combine exercícios aeróbicos com treino de força',
    'Evite carboidratos simples à noite'
  ];

  return [...baseRecommendations, ...goalSpecificRecommendations];
}