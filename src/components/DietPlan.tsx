import React from 'react';
import type { DietPlanType } from '../types';

interface DietPlanProps {
  plan: DietPlanType;
}

function DietPlan({ plan }: DietPlanProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-100">
        <p className="text-base sm:text-lg text-center">
          Calorias Diárias Recomendadas:{' '}
          <span className="font-semibold text-xl sm:text-2xl text-green-700">
            {Math.round(plan.calories)} kcal
          </span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Proteínas</p>
            <p className="font-semibold text-green-700">{plan.macroDistribution.protein}g</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Carboidratos</p>
            <p className="font-semibold text-green-700">{plan.macroDistribution.carbs}g</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Gorduras</p>
            <p className="font-semibold text-green-700">{plan.macroDistribution.fats}g</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Refeições Sugeridas</h3>
        <div className="grid gap-4">
          {plan.meals.map((meal, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h4 className="font-medium text-gray-800 mb-2 sm:mb-0">
                  {meal.name}
                </h4>
                {meal.macros && (
                  <div className="flex gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500">P: </span>
                      <span className="font-medium">{Math.round(meal.macros.protein)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-500">C: </span>
                      <span className="font-medium">{Math.round(meal.macros.carbs)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-500">G: </span>
                      <span className="font-medium">{Math.round(meal.macros.fats)}g</span>
                    </div>
                  </div>
                )}
              </div>
              <ul className="space-y-2">
                {meal.foods.map((food, foodIndex) => (
                  <li 
                    key={foodIndex}
                    className="flex items-start text-sm sm:text-base text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>{food}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Recomendações</h3>
        <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-100">
          <ul className="space-y-3">
            {plan.recommendations.map((rec, index) => (
              <li 
                key={index} 
                className="flex items-start text-sm sm:text-base text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DietPlan;