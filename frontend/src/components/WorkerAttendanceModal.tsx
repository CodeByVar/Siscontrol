import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  Search,
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AttendanceType } from '../types';

interface WorkerAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkerAttendanceModal: React.FC<WorkerAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { recordAttendanceCheck, employees } = useApp();

  const [dniInput, setDniInput] = useState('');
  const [verifiedWorker, setVerifiedWorker] = useState<any | null>(null);
  const [latestAttendance, setLatestAttendance] = useState<any | null>(null);
  const [suggestedType, setSuggestedType] = useState<AttendanceType>('CHECK_IN');

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }>({ latitude: null, longitude: null, accuracy: null });
  const [locationError, setLocationError] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Solicitar ubicación GPS tan pronto se abre el modal
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador o dispositivo no soporta geolocalización.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Permiso de GPS denegado. Por favor permite la ubicación para registrar tu asistencia.');
        } else {
          setLocationError('No se pudo obtener la señal GPS precisa del dispositivo.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      requestGpsLocation();
    } else {
      setDniInput('');
      setVerifiedWorker(null);
      setLatestAttendance(null);
      setFeedback(null);
    }
  }, [isOpen]);

  // Verificar trabajador por C.I.
  const handleVerifyDni = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dniInput.trim()) return;

    setFeedback(null);

    // 1. Intentar con API en la nube
    try {
      const res = await api.attendance.verifyWorker(dniInput.trim());
      if (res && res.employee) {
        setVerifiedWorker(res.employee);
        setLatestAttendance(res.latestAttendanceToday || null);
        setSuggestedType(res.suggestedNextType || 'CHECK_IN');
        return;
      }
    } catch {
      // 2. Fallback con base local si backend está en reposo
      const localEmp = employees.find((emp) => emp.dni === dniInput.trim());
      if (localEmp) {
        setVerifiedWorker(localEmp);
        setSuggestedType('CHECK_IN');
        return;
      }
      setFeedback({
        type: 'error',
        message: 'No se encontró ningún trabajador con el C.I. ingresado.',
        details: 'Verifica que el número esté escrito correctamente.',
      });
    }
  };

  // Enviar Marcaje
  const handleRecordAttendance = async (type: AttendanceType) => {
    if (!verifiedWorker) return;

    setIsSubmitting(true);
    setFeedback(null);

    const result = await recordAttendanceCheck({
      dni: verifiedWorker.dni,
      type,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      notes: location.accuracy ? `Precisión GPS: ±${location.accuracy}m` : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
      setFeedback({
        type: 'success',
        message: type === 'CHECK_IN' ? `¡Entrada registrada a las ${timeStr}!` : `¡Salida registrada a las ${timeStr}!`,
        details: location.latitude && location.longitude
          ? `Ubicación satelital confirmada (±${location.accuracy || 10}m).`
          : 'Marcaje registrado con hora oficial.',
      });

      // Actualizar estado sugerido para el siguiente marcaje
      setSuggestedType(type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN');
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Error al registrar el marcaje.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Marcaje de Asistencia con GPS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal móvil para trabajadores de Importadora Rivero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Status Banner */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl ${
              location.latitude
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              {location.latitude ? (
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    GPS Satelital Activo
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Lat: {location.latitude.toFixed(5)}, Lng: {location.longitude?.toFixed(5)} (&plusmn;{location.accuracy}m)
                  </span>
                </div>
              ) : isGettingLocation ? (
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Obteniendo coordenadas GPS...
                </span>
              ) : (
                <span className="font-bold text-slate-500">
                  Ubicación GPS no detectada
                </span>
              )}
            </div>
          </div>

          <button
            onClick={requestGpsLocation}
            title="Actualizar señal GPS"
            className="p-2 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>

        {locationError && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso de Ubicación:</p>
              <p className="text-[11px]">{locationError}</p>
            </div>
          </div>
        )}

        {/* Paso 1: Ingreso de C.I. */}
        {!verifiedWorker ? (
          <form onSubmit={handleVerifyDni} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Escribe tu Carnet de Identidad (C.I.):</span>
                <span className="text-[10px] text-brand-500 font-bold">Solo números</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value)}
                  placeholder="Ej: 9517526"
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Verificar
                </button>
              </div>
            </div>

            {/* Accesos rápidos sugeridos */}
            {employees.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  O toca tu nombre directamente:
                </span>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setDniInput(emp.dni);
                        setVerifiedWorker(emp);
                        setSuggestedType('CHECK_IN');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:border-brand-500/30 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5"
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      {emp.firstName} {emp.lastName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Paso 2: Ficha del Trabajador & Botones de Marcaje */
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Tarjeta de Trabajador Reconocido */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-brand-500/10 via-sky-500/5 to-indigo-500/10 border border-brand-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white font-black text-base flex items-center justify-center shadow-md">
                  {verifiedWorker.firstName?.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {verifiedWorker.firstName} {verifiedWorker.lastName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>C.I.: <strong className="text-slate-700 dark:text-slate-300">{verifiedWorker.dni}</strong></span>
                    <span>&bull;</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {verifiedWorker.position || verifiedWorker.department}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setVerifiedWorker(null);
                  setDniInput('');
                  setFeedback(null);
                }}
                className="text-xs text-brand-500 hover:text-brand-600 font-bold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors"
              >
                Cambiar C.I.
              </button>
            </div>

            {/* Estado Actual de Hoy */}
            {latestAttendance && (
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Último marcaje hoy:
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {latestAttendance.type === 'CHECK_IN' ? '🟢 Entrada' : '🔴 Salida'} a las{' '}
                  {new Date(latestAttendance.timestamp).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}

            {/* Mensajes de Éxito / Error */}
            {feedback && (
              <div className={`p-4 rounded-2xl border text-xs font-bold space-y-1 animate-in zoom-in-95 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-black">{feedback.message}</span>
                </div>
                {feedback.details && (
                  <p className="text-[11px] font-normal opacity-90 pl-6">{feedback.details}</p>
                )}
                {location.latitude && location.longitude && feedback.type === 'success' && (
                  <div className="pl-6 pt-1">
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] underline hover:opacity-80"
                    >
                      <span>Ver mi ubicación en Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Botones Grandes de Marcaje */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Botón ENTRADA */}
              <button
                type="button"
                onClick={() => handleRecordAttendance('CHECK_IN')}
                disabled={isSubmitting}
                className={`py-4 px-3 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                  suggestedType === 'CHECK_IN'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/40 hover:scale-[1.02] active:scale-98'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <LogIn className="w-6 h-6" />
                <span>MARCAR ENTRADA</span>
                <span className="text-[10px] font-normal opacity-80">Ingreso a turno</span>
              </button>

              {/* Botón SALIDA */}
              <button
                type="button"
                onClick={() => handleRecordAttendance('CHECK_OUT')}
                disabled={isSubmitting}
                className={`py-4 px-3 rounded-2xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                  suggestedType === 'CHECK_OUT'
                    ? 'bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-red-500/25 ring-2 ring-red-500/40 hover:scale-[1.02] active:scale-98'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/20 hover:text-rose-500 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <LogOut className="w-6 h-6" />
                <span>MARCAR SALIDA</span>
                <span className="text-[10px] font-normal opacity-80">Fin de jornada</span>
              </button>
            </div>

            {/* Botón Listo / Siguiente */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setVerifiedWorker(null);
                  setDniInput('');
                  setFeedback(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                ¿Otro trabajador va a marcar? Clic aquí
              </button>
            </div>
          </div>
        )}

        {/* Footer Informativo */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Hora sincronizada con servidor oficial &bull; Importadora Rivero
          </p>
        </div>
      </div>
    </div>
  );
};
