import React from 'react';
import { Calendar } from 'lucide-react';
import type { MealHistory } from '../types';

interface MealTrackingCalendarProps {
  mealHistory: MealHistory;
}

function MealTrackingCalendar({ mealHistory }: MealTrackingCalendarProps) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6); // Últimos 7 dias

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const calculateDailyPoints = (meals: MealHistory[string]) => {
    let points = 0;
    if (meals.breakfast) points += 25;
    if (meals.morningSnack) points += 25;
    if (meals.lunch) points += 50;
    if (meals.afternoonSnack) points += 25;
    if (meals.dinner) points += 50;
    return points;
  };

  const weeklyTotal = Object.values(mealHistory).reduce((total, meals) => {
    return total + calculateDailyPoints(meals);
  }, 0);

  const getMealLabel = (mealType: keyof MealHistory[string]) => {
    const labels: Record<keyof MealHistory[string], string> = {
      breakfast: 'Café da manhã (25 pts)',
      morningSnack: 'Lanche da manhã (25 pts)',
      lunch: 'Almoço (50 pts)',
      afternoonSnack: 'Lanche da tarde (25 pts)',
      dinner: 'Jantar (50 pts)'
    };
    return labels[mealType];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Histórico de Refeições
          </h3>
        </div>
        <div className="text-sm font-medium text-gray-600">
          Total da semana: {weeklyTotal} pontos
        </div>
      </div>

      <div className="space-y-4">
        {days.map((date) => {
          const dateStr = formatDate(date);
          const meals = mealHistory[dateStr] || {
            breakfast: false,
            morningSnack: false,
            lunch: false,
            afternoonSnack: false,
            dinner: false
          };
          const dailyPoints = calculateDailyPoints(meals);

          return (
            <div
              key={dateStr}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {dailyPoints} pontos
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.keys(meals) as Array<keyof typeof meals>).map((mealType) => (
                  <div
                    key={mealType}
                    className={`flex items-center gap-2 text-sm ${
                      meals[mealType] ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        meals[mealType] ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span>{getMealLabel(mealType)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Refeição realizada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span>Refeição não realizada</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealTrackingCalendar;