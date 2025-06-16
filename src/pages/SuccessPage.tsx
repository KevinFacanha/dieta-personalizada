import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { refetch } = useSubscription();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdParam = urlParams.get('session_id');
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
      
      // Refresh subscription data after successful payment
      setTimeout(() => {
        refetch();
        setLoading(false);
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [refetch]);

  const handleContinue = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <Loader2 className="w-16 h-16 text-green-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processando Pagamento
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos seu pagamento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h2>
        
        <p className="text-gray-600 mb-6">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos do seu plano.
        </p>

        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">ID da Sessão:</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {sessionId}
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Continuar para o App
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-sm text-gray-500 mt-4">
          Você receberá um email de confirmação em breve.
        </p>
      </div>
    </div>
  );
}

export default SuccessPage;