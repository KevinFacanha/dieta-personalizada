import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

interface StripeCheckoutButtonProps {
  planName: 'Pro' | 'Plus';
  price: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function StripeCheckoutButton({ 
  planName, 
  price, 
  disabled = false, 
  className = '',
  children 
}: StripeCheckoutButtonProps) {
  const { loading, createCheckoutSession } = useStripe();

  const handleCheckout = async () => {
    try {
      await createCheckoutSession(planName);
    } catch (error) {
      // Error is already handled in the hook
      console.error('Checkout failed:', error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
        ${disabled || loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
        }
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      {children || `Assinar ${planName} - R$ ${price.toFixed(2).replace('.', ',')}/mês`}
    </button>
  );
}

export default StripeCheckoutButton;