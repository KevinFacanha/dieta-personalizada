export interface DailyMeals {
  breakfast: boolean;
  morningSnack: boolean;
  lunch: boolean;
  afternoonSnack: boolean;
  dinner: boolean;
}

export interface MealHistory {
  [date: string]: DailyMeals;
}

export interface UserData {
  age: number;
  weight: number;
  height: number;
  gender: 'male' | 'female';
  activityLevel: string;
  sleepHours: number;
  goal: 'muscle' | 'fat_loss';
}

export interface Meal {
  name: string;
  foods: string[];
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface DietPlanType {
  calories: number;
  meals: Meal[];
  recommendations: string[];
  macroDistribution: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    name: string;
    preferences?: FoodPreferences;
    points: number;
    freeWeeklyMeals: number;
    lastWeekReset: string;
    mealHistory?: MealHistory;
  } | null;
}

export interface FoodPreferences {
  carbs: string[];
  proteins: string[];
  fruits: string[];
}

export interface RewardMeal {
  name: string;
  points: number;
  image: string;
}