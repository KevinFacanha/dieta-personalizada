import React from 'react';
import { Apple, Beef, Wheat } from 'lucide-react';
import { foodOptions } from '../data/foodOptions';
import type { FoodPreferences } from '../types';

interface FoodPreferencesProps {
  onComplete: (preferences: FoodPreferences) => void;
}

function FoodPreferences({ onComplete }: FoodPreferencesProps) {
  const [selectedFoods, setSelectedFoods] = React.useState<FoodPreferences>({
    carbs: [],
    proteins: [],
    fruits: []
  });

  const handleSelection = (category: keyof FoodPreferences, food: string) => {
    setSelectedFoods(prev => {
      const updated = { ...prev };
      if (updated[category].includes(food)) {
        updated[category] = updated[category].filter(f => f !== food);
      } else {
        updated[category] = [...updated[category], food];
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFoods.carbs.length === 0 || 
        selectedFoods.proteins.length === 0 || 
        selectedFoods.fruits.length === 0) {
      alert('Por favor, selecione pelo menos um alimento de cada categoria');
      return;
    }
    onComplete(selectedFoods);
  };

  const CategorySection = ({ 
    title, 
    icon, 
    category, 
    options 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    category: keyof FoodPreferences; 
    options: string[]; 
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map(food => (
          <button
            key={food}
            onClick={() => handleSelection(category, food)}
            className={`p-3 rounded-lg text-sm transition-colors ${
              selectedFoods[category].includes(food)
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {food}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Selecione suas Preferências Alimentares
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Escolha os alimentos que você mais gosta em cada categoria para personalizar seu plano alimentar
          </p>

          <form onSubmit={handleSubmit}>
            <CategorySection
              title="Carboidratos"
              icon={<Wheat className="w-5 h-5 text-green-600" />}
              category="carbs"
              options={foodOptions.carbs}
            />

            <CategorySection
              title="Proteínas"
              icon={<Beef className="w-5 h-5 text-green-600" />}
              category="proteins"
              options={foodOptions.proteins}
            />

            <CategorySection
              title="Frutas"
              icon={<Apple className="w-5 h-5 text-green-600" />}
              category="fruits"
              options={foodOptions.fruits}
            />

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FoodPreferences;