import React from 'react';
import { Trophy, Pizza, X } from 'lucide-react';
import { rewardMeals } from '../data/rewardMeals';
import type { RewardMeal } from '../types';

interface PointsDisplayProps {
  points: number;
  freeWeeklyMeals: number;
  onRedeemMeal: (meal: RewardMeal) => void;
}

function PointsDisplay({ points, freeWeeklyMeals, onRedeemMeal }: PointsDisplayProps) {
  const [showRewards, setShowRewards] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowRewards(!showRewards)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
      >
        <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
        <span className="font-medium text-yellow-800 text-sm sm:text-base">{points} pontos</span>
      </button>

      {showRewards && (
        <div className="fixed inset-0 sm:inset-auto sm:absolute z-50 sm:right-0 sm:mt-2">
          {/* Overlay de fundo */}
          <div className="fixed inset-0 bg-black bg-opacity-50 sm:hidden" onClick={() => setShowRewards(false)} />
          
          {/* Container principal do modal */}
          <div className="fixed sm:absolute inset-x-0 bottom-0 sm:inset-auto sm:w-96 bg-white rounded-t-xl sm:rounded-xl shadow-xl sm:shadow-2xl flex flex-col h-[80vh] sm:max-h-[600px]">
            {/* Cabeçalho fixo */}
            <div className="flex-shrink-0 bg-white z-10 px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Recompensas</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <Pizza className="w-4 h-4 inline-block mr-1" />
                    {2 - freeWeeklyMeals} refeições livres
                  </div>
                  <button 
                    onClick={() => setShowRewards(false)}
                    className="sm:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Área de rolagem */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 space-y-3">
                {rewardMeals.map((meal) => (
                  <div
                    key={meal.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm"
                        loading="lazy"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800">{meal.name}</h4>
                        <p className="text-sm text-gray-600">{meal.points} pontos</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onRedeemMeal(meal);
                        setShowRewards(false);
                      }}
                      disabled={points < meal.points || freeWeeklyMeals >= 2}
                      className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-medium min-w-[70px] transition-all ${
                        points >= meal.points && freeWeeklyMeals < 2
                          ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-sm'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Resgatar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé fixo */}
            <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 sm:p-6">
              <p className="text-xs text-gray-500 text-center">
                Você pode resgatar até 2 refeições livres por semana. Os pontos são acumulativos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PointsDisplay;