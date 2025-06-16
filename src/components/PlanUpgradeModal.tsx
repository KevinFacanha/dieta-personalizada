import React from 'react';
import { X, Crown, Star } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  featureName: string;
}

function PlanUpgradeModal({ isOpen, onClose, feature, featureName }: PlanUpgradeModalProps) {
  const { plans, createCheckoutSession } = useSubscription();

  const handleUpgrade = async (planId: string) => {
    try {
      const checkoutUrl = await createCheckoutSession(planId);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  const proFeatures = ['food_customization', 'history'];
  const plusFeatures = ['points_system', 'rewards', 'nutritionist_support'];

  const requiredPlan = plusFeatures.includes(feature) ? 'Plus' : 'Pro';
  const availablePlans = plans.filter(plan => 
    requiredPlan === 'Plus' ? ['Pro', 'Plus'].includes(plan.name) : plan.name === 'Pro'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Upgrade Necessário
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {requiredPlan === 'Plus' ? (
                <Crown className="w-8 h-8 text-yellow-600" />
              ) : (
                <Star className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recurso Premium
            </h3>
            <p className="text-gray-600">
              O recurso <strong>{featureName}</strong> está disponível apenas nos planos pagos.
              Faça upgrade para desbloquear este e outros recursos exclusivos.
            </p>
          </div>

          <div className="grid gap-4">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`
                  border-2 rounded-lg p-4 transition-all
                  ${plan.name === 'Plus' 
                    ? 'border-purple-200 bg-purple-50' 
                    : 'border-blue-200 bg-blue-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {plan.name === 'Plus' ? (
                        <Crown className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Star className="w-5 h-5 text-blue-600" />
                      )}
                      Plano {plan.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {plan.description}
                    </p>
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                      <span className="text-sm font-normal text-gray-600">/mês</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-colors
                      ${plan.name === 'Plus'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    Assinar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Cancele a qualquer momento. Sem compromisso de longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanUpgradeModal;