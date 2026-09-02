import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Search,
  Filter,
  LogIn,
  LogOut,
  Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AttendanceRecord } from '../types';

interface AttendanceAdminViewProps {
  onOpenWorkerModal: () => void;
}

export const AttendanceAdminView: React.FC<AttendanceAdminViewProps> = ({
  onOpenWorkerModal,
}) => {
  const { employees, backendStatus } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalEmployees: number;
    presentNow: number;
    finishedDay: number;
    absentToday: number;
    totalCheckedInToday: number;
  }>({
    totalEmployees: 0,
    presentNow: 0,
    finishedDay: 0,
    absentToday: 0,
    totalCheckedInToday: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar lista de marcajes de la fecha seleccionada
      const records = await api.attendance.getAll(selectedDate);
      if (Array.isArray(records)) {
        setAttendances(records);
      }

      // 2. Cargar resumen estadístico
      const sum = await api.attendance.getTodaySummary();
      if (sum) {
        setSummary({
          totalEmployees: sum.totalEmployees || employees.length,
          presentNow: sum.presentNow || 0,
          finishedDay: sum.finishedDay || 0,
          absentToday: sum.absentToday || 0,
          totalCheckedInToday: sum.totalCheckedInToday || 0,
        });
      }
    } catch (err) {
      console.warn('Error al cargar datos de asistencias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Filtrado de registros
  const filteredRecords = attendances.filter((att) => {
    const empName = att.employee
      ? `${att.employee.firstName} ${att.employee.lastName} ${att.employee.dni}`.toLowerCase()
      : '';
    const matchesSearch = empName.includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || att.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header con Título y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Clock className="w-5 h-5" />
            </div>
            Control de Asistencias & Geolocalización GPS
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervisa en tiempo real ingresos, salidas y la ubicación satelital exacta del personal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={loadData}
            title="Actualizar datos"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
          </button>

          {/* Botón Abrir Marcador Móvil */}
          <button
            onClick={onOpenWorkerModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>Abrir Marcador Móvil (C.I. + GPS)</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Diario */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Presentes Ahora */}
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              En Jornada Activa
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {summary.presentNow}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Personal laborando en este momento
          </span>
        </div>

        {/* Salidas Registradas */}
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-sky-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Jornada Finalizada
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {summary.finishedDay}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Marcajes de salida completados
          </span>
        </div>

        {/* Ausentes Hoy */}
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-rose-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Sin Registro Hoy
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {summary.absentToday}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Trabajadores pendientes de marcar
          </span>
        </div>

        {/* Total Marcajes Registrados */}
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-indigo-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Total Marcajes Hoy
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {attendances.length}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Entradas y salidas con GPS
          </span>
        </div>
      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o C.I...."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Todos ({attendances.length})
            </button>
            <button
              onClick={() => setFilterType('CHECK_IN')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'CHECK_IN'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-500'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('CHECK_OUT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'CHECK_OUT'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-rose-500'
              }`}
            >
              Salidas
            </button>
          </div>
        </div>
      </div>

      {/* 4. Tabla de Marcajes con Enlaces GPS */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No hay marcajes registrados para el {selectedDate}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Los trabajadores pueden marcar su asistencia usando su carnet de identidad y GPS desde su celular.
            </p>
            <button
              onClick={onOpenWorkerModal}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-sm hover:bg-brand-600 transition-all inline-flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Probar Marcaje Ahora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Trabajador</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Hora Oficial</th>
                  <th className="py-3 px-4">Ubicación GPS Satelital</th>
                  <th className="py-3 px-4 text-right">Mapa Google</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filteredRecords.map((att) => {
                  const emp = att.employee;
                  const timeStr = new Date(att.timestamp).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Trabajador */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs flex items-center justify-center border border-brand-500/20 shrink-0">
                            {emp ? emp.firstName.charAt(0) : 'T'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'Desconocido'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              C.I.: {emp?.dni || 'N/A'} &bull; {emp?.department || 'Almacén'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4">
                        {att.type === 'CHECK_IN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black">
                            <LogIn className="w-3 h-3" />
                            ENTRADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-black">
                            <LogOut className="w-3 h-3" />
                            SALIDA
                          </span>
                        )}
                      </td>

                      {/* Hora */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {timeStr}
                      </td>

                      {/* Coordenadas GPS */}
                      <td className="py-3.5 px-4">
                        {att.latitude && att.longitude ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500" />
                              {att.latitude.toFixed(5)}, {att.longitude.toFixed(5)}
                            </span>
                            {att.accuracy && (
                              <span className="text-[10px] text-slate-400 block">
                                Precisión: &plusmn;{att.accuracy}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            Sin GPS registrado
                          </span>
                        )}
                      </td>

                      {/* Enlace Google Maps */}
                      <td className="py-3.5 px-4 text-right">
                        {att.latitude && att.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Ver Mapa</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
