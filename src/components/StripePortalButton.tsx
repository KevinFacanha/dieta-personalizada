import React from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

interface StripePortalButtonProps {
  className?: string;
  children?: React.ReactNode;
}

function StripePortalButton({ className = '', children }: StripePortalButtonProps) {
  const { loading, createPortalSession } = useStripe();

  const handlePortal = async () => {
    try {
      await createPortalSession();
    } catch (error) {
      // Error is already handled in the hook
      console.error('Portal access failed:', error);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gray-600 hover:bg-gray-700 text-white'
        }
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Settings className="w-4 h-4" />
      )}
      {children || 'Gerenciar Assinatura'}
    </button>
  );
}

export default StripePortalButton;