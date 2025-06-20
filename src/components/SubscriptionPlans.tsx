import React from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import StripeCheckoutButton from './StripeCheckoutButton';
import StripePortalButton from './StripePortalButton';
import type { Plan } from '../types/subscription';

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: string) => void;
  showCurrentPlan?: boolean;
}

function SubscriptionPlans({ onSelectPlan, showCurrentPlan = true }: SubscriptionPlansProps) {
  const { plans, loading, getCurrentPlan, currentSubscription } = useSubscription();
  const currentPlan = getCurrentPlan();

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free':
        return <Zap className="w-8 h-8 text-gray-600" />;
      case 'Pro':
        return <Star className="w-8 h-8 text-blue-600" />;
      case 'Plus':
        return <Crown className="w-8 h-8 text-purple-600" />;
      default:
        return <Zap className="w-8 h-8 text-gray-600" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Free':
        return 'border-gray-200 hover:border-gray-300';
      case 'Pro':
        return 'border-blue-200 hover:border-blue-300 bg-blue-50';
      case 'Plus':
        return 'border-purple-200 hover:border-purple-300 bg-purple-50';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const handleFreePlan = () => {
    // For free plan, just call the callback
    onSelectPlan?.(plans.find(p => p.name === 'Free')?.id || '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha seu Plano
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Selecione o plano que melhor se adapta às suas necessidades nutricionais
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`
              relative rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-105
              ${getPlanColor(plan.name)}
              ${currentPlan === plan.name ? 'ring-2 ring-green-500' : ''}
            `}
          >
            {plan.name === 'Plus' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
            )}

            {showCurrentPlan && currentPlan === plan.name && (
              <div className="absolute -top-4 right-4">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Plano Atual
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {getPlanIcon(plan.name)}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {plan.description}
              </p>
              <div className="text-4xl font-bold text-gray-900">
                {plan.price === 0 ? (
                  'Grátis'
                ) : (
                  <>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                    <span className="text-lg font-normal text-gray-600">/mês</span>
                  </>
                )}
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              {currentPlan === plan.name ? (
                <div className="space-y-2">
                  <div className="w-full py-3 px-6 rounded-lg font-medium bg-gray-300 text-gray-500 text-center">
                    Plano Atual
                  </div>
                  {currentSubscription && plan.name !== 'Free' && (
                    <StripePortalButton className="w-full" />
                  )}
                </div>
              ) : plan.name === 'Free' ? (
                <button
                  onClick={handleFreePlan}
                  className="w-full py-3 px-6 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                  Usar Grátis
                </button>
              ) : (
                <StripeCheckoutButton
                  planName={plan.name as 'Pro' | 'Plus'}
                  price={plan.price}
                  className="w-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-600">
          Todos os planos incluem suporte por email. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}

export default SubscriptionPlans;