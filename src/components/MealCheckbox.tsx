import React, { useState, useCallback } from 'react';
import { Check } from 'lucide-react';

interface MealCheckboxProps {
  mealName: string;
  points: number;
  onComplete: () => void;
  disabled?: boolean;
}

function MealCheckbox({ mealName, points, onComplete, disabled }: MealCheckboxProps) {
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCheck = useCallback(async () => {
    if (disabled || checked || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      await onComplete();
      setChecked(true);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (err) {
      setError('Erro ao registrar refeição. Toque para tentar novamente.');
      console.error('Erro ao completar refeição:', err);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, checked, isLoading, onComplete]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCheck();
    }
  }, [handleCheck]);

  const handleErrorClick = useCallback(() => {
    if (error) {
      setError(null);
      handleCheck();
    }
  }, [error, handleCheck]);

  return (
    <div className="relative w-full">
      <button
        onClick={handleCheck}
        onKeyPress={handleKeyPress}
        disabled={disabled || checked || isLoading}
        aria-label={`Marcar ${mealName} como completa`}
        aria-disabled={disabled || checked || isLoading}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        className={`
          group w-full flex items-center gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg
          transition-all duration-300 select-none min-h-[3rem] sm:min-h-[3.5rem]
          focus:outline-none focus:ring-2 focus:ring-offset-1
          active:scale-95 touch-manipulation
          ${checked
            ? 'bg-green-100 text-green-800 cursor-default transform scale-95 focus:ring-green-500'
            : disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-400'
            : isLoading
            ? 'bg-gray-50 text-gray-600 cursor-wait focus:ring-gray-400'
            : 'bg-white hover:bg-green-50 text-gray-700 hover:scale-[1.02] shadow-sm hover:shadow focus:ring-green-500'
          }
          ${error ? 'border-red-300 animate-shake' : ''}
          ${showFeedback ? 'animate-success' : ''}
        `}
      >
        <div
          className={`
            w-5 h-5 sm:w-6 sm:h-6 rounded-md border flex items-center justify-center flex-shrink-0
            transition-colors duration-200
            ${checked
              ? 'bg-green-600 border-green-600'
              : disabled
              ? 'border-gray-300 bg-gray-50'
              : isLoading
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-300 group-hover:border-green-400'
            }
          `}
        >
          {checked && (
            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-check" />
          )}
          {isLoading && (
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          )}
        </div>

        <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden">
          <span className="font-medium text-xs sm:text-sm md:text-base truncate w-full">
            {mealName}
          </span>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500">
            <span>+{points} pts</span>
            {showFeedback && (
              <span className="text-green-600 animate-fade-in whitespace-nowrap">
                Pontos adicionados!
              </span>
            )}
          </div>
        </div>
      </button>

      {error && (
        <button
          onClick={handleErrorClick}
          className="absolute -bottom-6 sm:-bottom-7 left-0 right-0 text-[10px] sm:text-xs text-red-600 text-center bg-red-50 py-1 sm:py-1.5 px-2 rounded-md shadow-sm hover:bg-red-100 transition-colors"
        >
          {error}
        </button>
      )}
    </div>
  );
}

export default React.memo(MealCheckbox);