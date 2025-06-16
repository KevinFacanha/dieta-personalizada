import React, { useState } from 'react';
import { Crown, Star, Settings } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionPlans from './SubscriptionPlans';

function SubscriptionButton() {
  const { getCurrentPlan, currentSubscription, loading } = useSubscription();
  const [showPlans, setShowPlans] = useState(false);
  const currentPlan = getCurrentPlan();

  const getPlanIcon = () => {
    switch (currentPlan) {
      case 'Pro':
        return <Star className="w-4 h-4 text-blue-600" />;
      case 'Plus':
        return <Crown className="w-4 h-4 text-purple-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPlanColor = () => {
    switch (currentPlan) {
      case 'Pro':
        return 'bg-blue-100 hover:bg-blue-200 text-blue-800';
      case 'Plus':
        return 'bg-purple-100 hover:bg-purple-200 text-purple-800';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg px-4 py-2 w-24 h-10"></div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPlans(true)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
          ${getPlanColor()}
        `}
      >
        {getPlanIcon()}
        <span className="text-sm">
          {currentPlan === 'Free' ? 'Upgrade' : `Plano ${currentPlan}`}
        </span>
      </button>

      {showPlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowPlans(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Gerenciar Assinatura
                </h2>
                <button
                  onClick={() => setShowPlans(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <SubscriptionPlans onSelectPlan={() => setShowPlans(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SubscriptionButton;