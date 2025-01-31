import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings } from 'lucide-react';
import { foodOptions } from '../data/foodOptions';
import type { FoodPreferences } from '../types';

interface FoodPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: FoodPreferences;
  onSave: (preferences: FoodPreferences) => Promise<void>;
}

function FoodPreferencesModal({ isOpen, onClose, preferences, onSave }: FoodPreferencesModalProps) {
  const [selectedFoods, setSelectedFoods] = useState<FoodPreferences>(preferences);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedFoods(preferences);
  }, [preferences]);

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

  const handleSave = async () => {
    if (selectedFoods.carbs.length === 0 || 
        selectedFoods.proteins.length === 0 || 
        selectedFoods.fruits.length === 0) {
      setError('Por favor, selecione pelo menos um alimento de cada categoria');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(selectedFoods);
      onClose();
    } catch (err) {
      setError('Erro ao salvar preferências. Tente novamente.');
      console.error('Error saving preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const CategorySection = ({ 
    title, 
    category, 
    options 
  }: { 
    title: string; 
    category: keyof FoodPreferences; 
    options: string[]; 
  }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map(food => (
          <button
            key={food}
            onClick={() => handleSelection(category, food)}
            className={`
              p-2 rounded-lg text-sm transition-all duration-200
              flex items-center justify-between gap-2
              ${selectedFoods[category].includes(food)
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }
            `}
          >
            <span className="truncate">{food}</span>
            {selectedFoods[category].includes(food) ? (
              <Trash2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Plus className="w-4 h-4 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Gerenciar Alimentos Preferidos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <CategorySection
            title="Carboidratos"
            category="carbs"
            options={foodOptions.carbs}
          />

          <CategorySection
            title="Proteínas"
            category="proteins"
            options={foodOptions.proteins}
          />

          <CategorySection
            title="Frutas"
            category="fruits"
            options={foodOptions.fruits}
          />
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${loading
                  ? 'bg-green-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                }
              `}
            >
              {loading ? 'Salvando...' : 'Salvar Preferências'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoodPreferencesModal;