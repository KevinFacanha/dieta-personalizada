import React from 'react';
import { Dumbbell, Target } from 'lucide-react';

interface GoalSelectionProps {
  onSelect: (goal: 'muscle' | 'fat_loss') => void;
}

function GoalSelection({ onSelect }: GoalSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Qual é o seu objetivo?
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Escolha seu objetivo principal para personalizarmos seu plano alimentar
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => onSelect('muscle')}
              className="group relative bg-white border-2 border-green-500 rounded-xl p-6 hover:bg-green-50 transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Dumbbell className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Ganho de Massa</h3>
                <p className="text-gray-600 text-center text-sm">
                  Foco em ganho de massa muscular com superávit calórico controlado
                </p>
              </div>
            </button>

            <button
              onClick={() => onSelect('fat_loss')}
              className="group relative bg-white border-2 border-blue-500 rounded-xl p-6 hover:bg-blue-50 transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Perda de Gordura</h3>
                <p className="text-gray-600 text-center text-sm">
                  Foco em perda de gordura com déficit calórico sustentável
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalSelection