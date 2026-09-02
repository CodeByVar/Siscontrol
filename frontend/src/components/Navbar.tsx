import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Server,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useApp, SYSTEM_USERS } from '../context/AppContext';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNotifications,
}) => {
  const {
    currentRole,
    currentUser,
    logout,
    theme,
    toggleTheme,
    advances,
    payrollRecords,
    backendStatus,
    backendUrl,
    setBackendUrl,
    syncWithBackend,
  } = useApp();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(backendUrl);
  const [isTesting, setIsTesting] = useState(false);

  const user = currentUser || SYSTEM_USERS['betito01.hra@gmail.com'];

  // Notificaciones no leídas y alertas de vencimiento
  const pendingAdvancesCount = advances.filter((a) => a.status === 'PENDING').length;
  const pendingWeeklyPayCount = payrollRecords.filter((r) => r.employee.paymentFrequency === 'SEMANAL' && r.status === 'DRAFT').length;
  const pendingMonthlyPayCount = payrollRecords.filter((r) => r.employee.paymentFrequency === 'MENSUAL' && r.status === 'DRAFT').length;
  
  const totalNotifications = pendingAdvancesCount + (pendingWeeklyPayCount > 0 ? 1 : 0) + (pendingMonthlyPayCount > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 lg:px-8 grid grid-cols-12 items-center transition-colors duration-200">
      {/* 1. Left Side: Official Brand Logo */}
      <div className="col-span-4 flex items-center">
        <Logo />
      </div>

      {/* 2. Middle Center: Welcome Greeting */}
      <div className="col-span-4 text-center hidden md:block">
        <h1 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          ¡Bienvenido, {user.name}!
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
          Panel de Administración y Control Salarial de Importadora Rivero
        </p>
      </div>

      {/* 3. Right Side: Controls & Profile Pill */}
      <div className="col-span-8 md:col-span-4 flex items-center justify-end gap-2.5">
        {/* Cloud Database Connection Status Pill */}
        <button
          onClick={() => setIsConfigOpen(true)}
          title="Estado de conexión con la base de datos PostgreSQL (Render)"
          className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
            backendStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : backendStatus === 'connecting'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 animate-pulse'
              : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
          }`}
        >
          {backendStatus === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nube Conectada</span>
            </>
          ) : backendStatus === 'connecting' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Conectando...</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modo Local</span>
            </>
          )}
        </button>

        {/* Search Icon Button (Active) */}
        <button
          onClick={onOpenSearch}
          title="Buscar trabajador por nombre o DNI (Ctrl+K)"
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:border-brand-500 dark:hover:border-brand-500 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification Bell Button (Active with Deadline Tracking) */}
        <button
          onClick={onOpenNotifications}
          title="Notificaciones y avisos de vencimiento"
          className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:border-brand-500 dark:hover:border-brand-500 transition-all flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          <Bell className="w-4 h-4" />
          {totalNotifications > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm animate-pulse">
              {totalNotifications}
            </span>
          ) : (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-center shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Capsule Profile Pill */}
        <div className="relative flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-1.5 pl-1.5 pr-3.5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center border border-purple-400 shadow-sm shrink-0">
            {user.name.charAt(0)}
          </div>

          <div className="text-left leading-tight hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {user.name}
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                ADMIN
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block max-w-[140px]">
              {user.email}
            </span>
          </div>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="p-2.5 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-1 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Configuración y Sincronización con Backend */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Conexión con PostgreSQL en la Nube
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sincronización centralizada con Render
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Estado actual */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Estado del Servidor:
              </span>
              <div className="flex items-center gap-1.5">
                {backendStatus === 'connected' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    En línea (PostgreSQL)
                  </span>
                ) : backendStatus === 'connecting' ? (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Conectando...
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 text-xs font-black flex items-center gap-1.5">
                    <CloudOff className="w-3.5 h-3.5" />
                    Modo Local (Offline)
                  </span>
                )}
              </div>
            </div>

            {/* Input URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                URL de la API de Render:
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://siscontrol-backend.onrender.com/api"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Si tu backend en Render tiene otra dirección, puedes cambiarla aquí.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  setIsTesting(true);
                  setBackendUrl(inputUrl);
                  await syncWithBackend();
                  setIsTesting(false);
                }}
                disabled={isTesting}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Sincronizar y Probar
              </button>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
