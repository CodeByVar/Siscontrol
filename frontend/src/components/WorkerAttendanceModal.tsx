import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  FileText,
  DollarSign,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AttendanceType } from '../types';
import { generatePayslipPDF } from '../lib/pdfGenerator';

interface WorkerAttendanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isPublicMode?: boolean; // Si es true, oculta la X y no permite salir al login
}

export const WorkerAttendanceModal: React.FC<WorkerAttendanceModalProps> = ({
  isOpen,
  onClose,
  isPublicMode = false,
}) => {
  const { recordAttendanceCheck, employees, currencySymbol } = useApp();

  // Modo: 'ATTENDANCE' (Marcar GPS) o 'PORTAL' (Consultar Sueldos / Boletas)
  const [activeMode, setActiveMode] = useState<'ATTENDANCE' | 'PORTAL'>('ATTENDANCE');

  // --- Estados de Marcaje de Asistencia ---
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

  // --- Estados del Portal de Consulta con PIN ---
  const [portalDni, setPortalDni] = useState('');
  const [portalPin, setPortalPin] = useState('');
  const [portalNewPin, setPortalNewPin] = useState('');
  const [portalConfirmPin, setPortalConfirmPin] = useState('');
  const [showPortalPin, setShowPortalPin] = useState(false);
  const [pinStep, setPinStep] = useState<'ENTER_DNI' | 'ENTER_PIN' | 'CREATE_PIN' | 'VIEW_DATA'>('ENTER_DNI');
  const [portalWorker, setPortalWorker] = useState<any | null>(null);
  const [portalData, setPortalData] = useState<{
    employee: any;
    payrollRecords: any[];
    advances: any[];
    attendances: any[];
  } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  // Solicitar ubicación GPS
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador o celular no soporta geolocalización.');
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
          setLocationError('Permiso de GPS denegado. Por favor autoriza la ubicación en tu navegador para registrar asistencia.');
        } else {
          setLocationError('Buscando señal GPS del dispositivo...');
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
      resetAttendanceForm();
      resetPortalForm();
    }
  }, [isOpen]);

  const resetAttendanceForm = () => {
    setDniInput('');
    setVerifiedWorker(null);
    setLatestAttendance(null);
    setFeedback(null);
  };

  const resetPortalForm = () => {
    setPortalDni('');
    setPortalPin('');
    setPortalNewPin('');
    setPortalConfirmPin('');
    setPinStep('ENTER_DNI');
    setPortalWorker(null);
    setPortalData(null);
    setPortalError('');
  };

  // 1. Verificar C.I. para Marcaje
  const handleVerifyDni = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dniInput.trim()) return;

    setFeedback(null);

    try {
      const res = await api.attendance.verifyWorker(dniInput.trim());
      if (res && res.employee) {
        setVerifiedWorker(res.employee);
        setLatestAttendance(res.latestAttendanceToday || null);
        setSuggestedType(res.suggestedNextType || 'CHECK_IN');
        return;
      }
    } catch {
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

  // 2. Enviar Marcaje de Asistencia
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

      setSuggestedType(type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN');
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Error al registrar el marcaje.',
      });
    }
  };

  // --- Lógica del Portal de Consulta con PIN ---

  // Paso 1: Verificar si el C.I. tiene PIN creado
  const handleCheckPortalDni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalDni.trim()) return;

    setPortalError('');
    setPortalLoading(true);

    try {
      const res = await api.worker.checkPinStatus(portalDni.trim());
      if (res && res.employee) {
        setPortalWorker(res.employee);
        if (res.hasPin) {
          setPinStep('ENTER_PIN');
        } else {
          setPinStep('CREATE_PIN');
        }
      }
    } catch (err: any) {
      // Fallback local
      const localEmp = employees.find((emp) => emp.dni === portalDni.trim());
      if (localEmp) {
        setPortalWorker(localEmp);
        setPinStep('CREATE_PIN');
      } else {
        setPortalError('No se encontró ningún trabajador activo con ese C.I.');
      }
    } finally {
      setPortalLoading(false);
    }
  };

  // Paso 2A: Crear PIN por primera vez
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalNewPin || portalNewPin.length < 4) {
      setPortalError('El PIN debe tener al menos 4 números.');
      return;
    }
    if (portalNewPin !== portalConfirmPin) {
      setPortalError('Los PINs ingresados no coinciden.');
      return;
    }

    setPortalError('');
    setPortalLoading(true);

    try {
      await api.worker.setPin(portalWorker.dni, portalNewPin);
      // Tras crearlo, cargar sus datos
      const dataRes = await api.worker.getPortalData(portalWorker.dni, portalNewPin);
      setPortalData(dataRes);
      setPinStep('VIEW_DATA');
    } catch (err: any) {
      setPortalError(err.message || 'Error al crear el PIN de seguridad.');
    } finally {
      setPortalLoading(false);
    }
  };

  // Paso 2B: Ingresar PIN existente
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalPin) return;

    setPortalError('');
    setPortalLoading(true);

    try {
      const dataRes = await api.worker.getPortalData(portalWorker.dni, portalPin);
      setPortalData(dataRes);
      setPinStep('VIEW_DATA');
    } catch (err: any) {
      setPortalError('PIN incorrecto. Inténtalo de nuevo.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Portal del Trabajador
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Importadora Rivero &bull; Acceso Móvil
              </p>
            </div>
          </div>

          {/* Botón X solo visible si NO está en modo público (Kiosco) */}
          {!isPublicMode && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selector de Pestañas: Asistencia vs Consulta de Pagos */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMode('ATTENDANCE')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'ATTENDANCE'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>1. Marcar Asistencia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('PORTAL')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'PORTAL'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>2. Consultar Mis Pagos</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* PESTAÑA 1: MARCAJE DE ASISTENCIA RÁPIDO (C.I. + GPS)     */}
        {/* ========================================================= */}
        {activeMode === 'ATTENDANCE' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* GPS Banner */}
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

            {!verifiedWorker ? (
              <form onSubmit={handleVerifyDni} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Escribe tu Carnet de Identidad (C.I.):</span>
                    <span className="text-[10px] text-brand-500 font-bold">Sin contraseña</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dniInput}
                      onChange={(e) => setDniInput(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Continuar
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
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:border-brand-500/30 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
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
              /* Ficha de Marcaje */
              <div className="space-y-4 animate-in fade-in duration-150">
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
                    className="text-xs text-brand-500 hover:text-brand-600 font-bold px-2 py-1 rounded-lg hover:bg-brand-500/10 transition-colors cursor-pointer"
                  >
                    Cambiar C.I.
                  </button>
                </div>

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

                {/* Botones ENTRADA y SALIDA */}
                <div className="grid grid-cols-2 gap-3 pt-2">
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

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedWorker(null);
                      setDniInput('');
                      setFeedback(null);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    ¿Otro trabajador va a marcar? Clic aquí
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: PORTAL DE CONSULTA DE PAGOS (CON PIN PERSONAL)  */}
        {/* ========================================================= */}
        {activeMode === 'PORTAL' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {portalError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{portalError}</span>
              </div>
            )}

            {/* Paso 1: Ingresar C.I. */}
            {pinStep === 'ENTER_DNI' && (
              <form onSubmit={handleCheckPortalDni} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Consulta Segura de Salarios:</p>
                    <p className="text-[11px] opacity-90">
                      Tus estados de pago y boletas están protegidos por tu PIN personal para que nadie más pueda verlos.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ingresa tu Carnet de Identidad (C.I.):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={portalDni}
                    onChange={(e) => setPortalDni(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={portalLoading}
                  className="w-full py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md hover:from-brand-500 hover:to-sky-400 transition-all cursor-pointer"
                >
                  {portalLoading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>
            )}

            {/* Paso 2A: Crear PIN por primera vez */}
            {pinStep === 'CREATE_PIN' && portalWorker && (
              <form onSubmit={handleCreatePin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ¡Hola {portalWorker.firstName}! Crea tu PIN personal
                  </p>
                  <p className="text-[11px] mt-1 opacity-90">
                    Es tu primera vez consultando. Crea un PIN secreto (mínimo 4 números) para que solo tú puedas ver tus recibos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Crea tu nuevo PIN (Ej: 1234):
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={8}
                    value={portalNewPin}
                    onChange={(e) => setPortalNewPin(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirma tu nuevo PIN:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={8}
                    value={portalConfirmPin}
                    onChange={(e) => setPortalConfirmPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={portalLoading}
                  className="w-full py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md hover:from-emerald-500 transition-all cursor-pointer"
                >
                  {portalLoading ? 'Guardando...' : 'Guardar PIN y Ver Mis Pagos'}
                </button>
              </form>
            )}

            {/* Paso 2B: Ingresar PIN existente */}
            {pinStep === 'ENTER_PIN' && portalWorker && (
              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 font-black text-xs flex items-center justify-center">
                      {portalWorker.firstName?.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {portalWorker.firstName} {portalWorker.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">C.I.: {portalWorker.dni}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetPortalForm}
                    className="text-xs text-brand-500 font-bold hover:underline"
                  >
                    Cambiar C.I.
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ingresa tu PIN de seguridad:
                  </label>
                  <div className="relative">
                    <input
                      type={showPortalPin ? 'text' : 'password'}
                      inputMode="numeric"
                      required
                      value={portalPin}
                      onChange={(e) => setPortalPin(e.target.value)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPortalPin(!showPortalPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPortalPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={portalLoading}
                  className="w-full py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-md hover:from-brand-500 transition-all cursor-pointer"
                >
                  {portalLoading ? 'Validando PIN...' : 'Ver Mis Estados de Pago'}
                </button>
              </form>
            )}

            {/* Paso 3: Ver Datos Salariales & Boletas */}
            {pinStep === 'VIEW_DATA' && portalData && (() => {
              const countdown = (() => {
                const today = new Date();
                const isWeekly = portalData.employee.paymentFrequency === 'SEMANAL';
                if (isWeekly) {
                  const currentDay = today.getDay(); // 0=Dom, ..., 6=Sab
                  let daysLeft = 6 - currentDay;
                  if (daysLeft < 0) daysLeft = 6;
                  const percent = Math.min(100, Math.max(15, Math.round(((6 - daysLeft) / 6) * 100)));
                  return {
                    title: 'Próximo Pago Semanal',
                    targetDate: daysLeft === 0 ? '¡Hoy Sábado es día de pago! 🎉' : 'Este Sábado',
                    daysLeft,
                    percent,
                    isToday: daysLeft === 0,
                  };
                } else {
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                  const currentDayOfMonth = today.getDate();
                  const daysLeft = Math.max(0, lastDayOfMonth - currentDayOfMonth);
                  const percent = Math.min(100, Math.max(10, Math.round((currentDayOfMonth / lastDayOfMonth) * 100)));
                  const monthName = today.toLocaleDateString('es-BO', { month: 'long' });
                  return {
                    title: 'Próximo Pago Mensual',
                    targetDate: daysLeft === 0 ? '¡Hoy fin de mes!' : `Fin de ${monthName} (${lastDayOfMonth} de ${monthName})`,
                    daysLeft,
                    percent,
                    isToday: daysLeft === 0,
                  };
                }
              })();

              const handleDownloadPDF = (rec: any) => {
                const fullRecord: any = {
                  id: rec.id,
                  periodId: rec.periodId,
                  employeeId: portalData.employee.id,
                  employee: portalData.employee,
                  baseSalary: Number(portalData.employee.baseSalary),
                  workedDays: rec.workedDays,
                  overtimeHours: rec.overtimeHours || 0,
                  overtimeAmount: rec.overtimeAmount || 0,
                  bonusesAmount: rec.bonusesAmount || 0,
                  advancesDeduction: rec.advancesDeduction || 0,
                  otherDeductions: rec.otherDeductions || 0,
                  totalEarnings: rec.totalEarnings || portalData.employee.baseSalary,
                  totalDeductions: rec.totalDeductions || 0,
                  netAmount: rec.netAmount,
                  status: rec.status,
                  items: rec.items || [],
                };

                const fullPeriod: any = {
                  id: rec.periodId,
                  code: rec.periodCode || 'RECIBO',
                  name: rec.periodName || 'Periodo de Pago',
                  frequency: portalData.employee.paymentFrequency,
                  startDate: rec.startDate ? String(rec.startDate).split('T')[0] : '2026-09-01',
                  endDate: rec.endDate ? String(rec.endDate).split('T')[0] : '2026-09-30',
                  year: 2026,
                  periodNumber: 1,
                  status: rec.periodStatus || 'OPEN',
                };

                generatePayslipPDF(fullRecord, fullPeriod);
              };

              return (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Encabezado del Trabajador */}
                  <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {portalData.employee.firstName} {portalData.employee.lastName}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {portalData.employee.position} &bull; Modalidad {portalData.employee.paymentFrequency}
                      </span>
                    </div>
                    <button
                      onClick={resetPortalForm}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </div>

                  {/* 1. Tarjeta Cuenta Regresiva: ¿Cuándo cobro? */}
                  <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600 text-white shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-sky-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {countdown.title}
                      </span>
                      <span className="text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        {countdown.targetDate}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        {countdown.isToday ? (
                          <span className="text-xl font-black text-white">¡Día de Liquidación!</span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black">{countdown.daysLeft}</span>
                            <span className="text-xs text-sky-100 font-bold">
                              {countdown.daysLeft === 1 ? 'día restante' : 'días restantes'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-sky-100">
                        Sueldo Base: {currencySymbol} {Number(portalData.employee.baseSalary).toFixed(2)}
                      </span>
                    </div>

                    {/* Barra de Progreso del Ciclo */}
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden mt-1">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${countdown.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Recibos de Pago y Descarga de Boleta PDF */}
                  <div className="space-y-2.5">
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                      Mis Recibos y Boletas de Pago
                    </h5>

                    {portalData.payrollRecords && portalData.payrollRecords.length > 0 ? (
                      portalData.payrollRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-black text-slate-900 dark:text-white block">
                              {rec.periodName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Días asistidos: {rec.workedDays} &bull; Líquido: <strong className="text-emerald-600 dark:text-emerald-400">{currencySymbol} {Number(rec.netAmount).toFixed(2)}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                rec.status === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {rec.status === 'PAID' ? 'PAGADO' : 'EN CURSO'}
                            </span>

                            {/* Botón Descargar Boleta en PDF */}
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(rec)}
                              title="Descargar Boleta de Pago en PDF"
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                        Aún no tienes recibos de nómina liquidados en este periodo.
                      </div>
                    )}
                  </div>

                  {/* 3. Historial de Marcajes y Asistencias GPS */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        Mis Asistencias Registradas (GPS)
                      </h5>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {portalData.attendances?.length || 0} marcajes
                      </span>
                    </div>

                    {portalData.attendances && portalData.attendances.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {portalData.attendances.map((att) => {
                          const attDate = new Date(att.timestamp);
                          const isToday = attDate.toDateString() === new Date().toDateString();
                          const dateStr = isToday
                            ? 'Hoy'
                            : attDate.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' });
                          const timeStr = attDate.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={att.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`p-1 rounded-lg ${
                                  att.type === 'CHECK_IN'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}>
                                  {att.type === 'CHECK_IN' ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white block">
                                    {att.type === 'CHECK_IN' ? 'Entrada Registrada' : 'Salida Registrada'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {dateStr} &bull; {timeStr}
                                  </span>
                                </div>
                              </div>

                              {att.latitude && att.longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-sky-500 hover:text-sky-600 font-bold flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded-lg"
                                >
                                  <MapPin className="w-2.5 h-2.5" />
                                  <span>Mapa</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono">Hora oficial</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                        Aún no tienes marcajes de asistencia registrados.
                      </div>
                    )}
                  </div>

                  {/* 4. Anticipos y Vales */}
                  {portalData.advances && portalData.advances.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                        Anticipos y Vales
                      </h5>
                      <div className="space-y-1.5">
                        {portalData.advances.map((adv) => (
                          <div
                            key={adv.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {adv.reason}
                            </span>
                            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                              {currencySymbol} {Number(adv.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Portal Oficial &bull; Importadora Rivero
          </p>
        </div>
      </div>
    </div>
  );
};
