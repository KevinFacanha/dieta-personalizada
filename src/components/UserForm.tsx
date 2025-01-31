import React, { useRef } from 'react';
import type { UserData } from '../types';

const activityLevels = [
  { value: 'sedentary', label: 'Sedentário (pouco ou nenhum exercício)' },
  { value: 'light', label: 'Levemente Ativo (exercício leve 1-3x por semana)' },
  { value: 'moderate', label: 'Moderadamente Ativo (exercício 3-5x por semana)' },
  { value: 'very', label: 'Muito Ativo (exercício pesado 6-7x por semana)' },
  { value: 'extra', label: 'Extremamente Ativo (exercício muito pesado, trabalho físico)' }
];

interface UserFormProps {
  onSubmit: (data: UserData) => void;
  onDietGenerated?: () => void;
}

function UserForm({ onSubmit, onDietGenerated }: UserFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Aceita tanto vírgula quanto ponto como separador decimal
    const heightStr = (formData.get('height') as string).replace(',', '.');
    const height = parseFloat(heightStr) * 100; // Converte para centímetros
    
    if (isNaN(height) || height < 100 || height > 250) {
      alert('Por favor, insira uma altura válida entre 1,00 e 2,50 metros');
      return;
    }
    
    onSubmit({
      age: Number(formData.get('age')),
      weight: Number(formData.get('weight')),
      height: height,
      gender: formData.get('gender') as 'male' | 'female',
      activityLevel: formData.get('activityLevel') as string,
      sleepHours: Number(formData.get('sleepHours'))
    });

    // Chama o callback após gerar a dieta
    if (onDietGenerated) {
      // Pequeno delay para garantir que a dieta foi renderizada
      setTimeout(onDietGenerated, 100);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Idade</label>
          <input
            type="number"
            name="age"
            required
            min="15"
            max="100"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Peso (kg)</label>
          <input
            type="number"
            name="weight"
            required
            step="0.1"
            min="30"
            max="300"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Altura (m)</label>
          <input
            type="text"
            name="height"
            required
            placeholder="Digite sua altura (ex: 1,75)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
          <small className="text-gray-500">Use vírgula ou ponto (ex: 1,75 ou 1.75)</small>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Horas de Sono</label>
          <input
            type="number"
            name="sleepHours"
            required
            min="4"
            max="12"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gênero</label>
        <div className="mt-1 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="gender"
              value="male"
              required
              className="text-green-600 focus:ring-green-500"
            />
            <span className="ml-2">Masculino</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="gender"
              value="female"
              required
              className="text-green-600 focus:ring-green-500"
            />
            <span className="ml-2">Feminino</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nível de Atividade Física
        </label>
        <select
          name="activityLevel"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        >
          {activityLevels.map(level => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Gerar Plano Alimentar
      </button>
    </form>
  );
}

export default UserForm;