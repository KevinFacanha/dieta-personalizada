import React, { useState } from 'react';
import { Lock, Mail, User } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onToggleRegister: () => void;
}

function Login({ onLogin, onToggleRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err: any) {
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError('Erro ao fazer login. Por favor, tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await onLogin('teste@email.com', '123456');
    } catch (err: any) {
      setError('Erro ao fazer login com conta de teste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Bem-vindo de volta!
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Entre para acessar seu plano alimentar personalizado
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Mínimo de 6 caracteres
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-all ${
              loading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 hover:shadow-lg'
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={onToggleRegister}
            disabled={loading}
            className={`w-full text-center py-3 text-sm font-medium rounded-xl transition-all ${
              loading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            Não tem uma conta? Cadastre-se
          </button>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4">
            <button
              onClick={handleTestLogin}
              disabled={loading}
              className={`w-full text-center text-xs py-2 rounded-lg transition-all ${
                loading 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
              }`}
            >
              {loading ? 'Entrando...' : 'Entrar com conta de teste'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;