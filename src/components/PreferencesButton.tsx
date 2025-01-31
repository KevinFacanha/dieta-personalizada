import React from 'react';
import { Settings } from 'lucide-react';

interface PreferencesButtonProps {
  onClick: () => void;
}

const PreferencesButton: React.FC<PreferencesButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title="Gerenciar alimentos preferidos"
    >
      <Settings className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
      <span className="font-medium text-gray-700 text-sm sm:text-base">
        Preferências
      </span>
    </button>
  );
};

export default PreferencesButton;