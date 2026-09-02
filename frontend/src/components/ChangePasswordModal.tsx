import React, { useState } from 'react';
import { X, KeyRound, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { changeUserPassword } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Por favor completa todos los campos.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las nuevas contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await changeUserPassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMessage('¡Contraseña actualizada exitosamente en PostgreSQL!');
        setTimeout(() => {
          onClose();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cambiar Contraseña
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seguridad de tu cuenta de Administrador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña Actual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Contraseña Actual:
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nueva Contraseña (mínimo 6 caracteres):
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirmar Nueva Contraseña:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la nueva contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              {isLoading ? 'Guardando...' : 'Actualizar Contraseña'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
