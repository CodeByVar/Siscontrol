import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setErrorMessage('Credenciales incorrectas. Verifica el correo o la contraseña.');
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Error al conectar. Verifica tu conexión.');
      setIsLoading(false);
    }
  };

  const handleQuickLoginAdmin = async () => {
    setEmail('betito01.hra@gmail.com');
    setPassword('20202020');
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login('betito01.hra@gmail.com', '20202020');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 backdrop-blur-xl">
        {/* Left Side: Brand presentation */}
        <div className="md:col-span-5 p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Logo oficial */}
            <div className="h-16 px-4 py-2 rounded-2xl bg-black inline-flex items-center justify-center shadow-lg border border-slate-800">
              <img
                src="/logo-rivero.png"
                alt="Importadora Rivero"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Sistema Integral de Nóminas y Salarios
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Plataforma corporativa para gestión de sueldos semanales y mensuales, control de adelantos y emisión de boletas oficiales.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Acceso Administrador Seguro</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Pagos directos por QR Simple Bancario</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Liquidación semanal (7d) y mensual (30d)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            <p>&copy; 2026 Importadora Rivero S.R.L. &bull; v2.0</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-500" />
                Iniciar Sesión Administrador
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa con tu correo de administrador y contraseña asignada
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-4 animate-shake">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Usuario / Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-medium"
                    placeholder="betito01.hra@gmail.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-sm tracking-wider"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-brand-600 via-sky-500 to-indigo-600 hover:from-brand-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <span>Ingresar al Sistema de Nóminas</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Seguridad y Privacidad */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Acceso restringido y cifrado a personal autorizado de Importadora Rivero
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
