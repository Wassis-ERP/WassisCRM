import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, Loader2, Link } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redireciona logo caso já esteja logado
  useEffect(() => {
    if (session) {
      // route of origin ou dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location.state]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!email || !password) {
      setErrorMsg('Forneça e-mail e senha para acessar.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // O AuthContext ou o useEffect via session já devem interceptar e redirecionar
    } catch (err: any) {
      console.error('[Login Error]', err);
      if (err.message.includes('Invalid login credentials')) {
        setErrorMsg('Usuário ou senha inválidos.');
      } else {
        setErrorMsg(err.message || 'Falha ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        
        {/* Card de Fundo Premium */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
          
          {/* Faixa decorativa superior */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="p-8 sm:p-10">
            <div className="mb-8 text-center flex flex-col items-center">
              <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                <Link className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Gestor Wassis
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Acesso unificado e seguro do CRM.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 mr-3 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  {errorMsg}
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="voce@exemplo.com.br"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Senha Fixa
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-950"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500 dark:text-slate-400">
                    Manter conectado
                  </label>
                </div>
                {/* 
                <div className="text-sm">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
                */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <span className="flex items-center">
                     <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                     Autenticando...
                   </span>
                ) : (
                  'Acessar Sistema'
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Restrito a Colaboradores e Corretores Autorizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
