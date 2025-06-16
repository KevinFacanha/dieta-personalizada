import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function CancelPage() {
  const handleRetry = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Cancelado
        </h2>
        
        <p className="text-gray-600 mb-6">
          Seu pagamento foi cancelado. Nenhuma cobrança foi realizada em seu cartão.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>

          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Se você teve problemas durante o pagamento, entre em contato conosco.
        </p>
      </div>
    </div>
  );
}

export default CancelPage;