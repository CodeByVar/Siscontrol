import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Copy,
  Check,
  Search,
  RefreshCw,
  Coins,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AttendanceRecord } from '../types';

interface WeeklyAttendanceMatrixProps {
  onOpenWorkerModal?: () => void;
}

export const WeeklyAttendanceMatrix: React.FC<WeeklyAttendanceMatrixProps> = ({
  onOpenWorkerModal,
}) => {
  const { employees, formatMoney } = useApp();

  // Helper para obtener el Lunes de la semana de cualquier fecha
  const getMonday = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [weeklyAttendances, setWeeklyAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLateFilter, setOnlyLateFilter] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Multa por retraso en Bolivianos (por defecto 10 Bs)
  const [penaltyPerLate, setPenaltyPerLate] = useState<number>(10);

  // Generar los 7 días de la semana seleccionada (Lunes a Domingo)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      return d;
    });
  }, [currentMonday]);

  const startDateStr = weekDays[0].toISOString().split('T')[0];
  const endDateStr = weekDays[6].toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Cargar datos de la semana desde el backend
  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      const records = await api.attendance.getAll(undefined, undefined, startDateStr, endDateStr);
      if (Array.isArray(records)) {
        setWeeklyAttendances(records);
      }
    } catch (err) {
      console.warn('Error al cargar matriz semanal de asistencias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeekData();
  }, [startDateStr, endDateStr]);

  // Navegación de semanas
  const handlePrevWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleThisWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Nombres y formatos en español
  const dayNamesShort = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Procesamiento de Asistencias y Multas por Empleado
  const processedData = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

    return activeEmployees.map((emp) => {
      let totalWorkedDays = 0;
      let totalLateCount = 0;
      let totalLateMinutes = 0;

      const daysDetails = weekDays.map((day) => {
        const dateStr = day.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const isFuture = dateStr > todayStr;
        const dayOfWeek = day.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb

        // Verificar si es día libre según horario del trabajador
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;
        const isOffDay = isSunday || (isSaturday && emp.workSchedule === 'LUNES_A_VIERNES');

        // Buscar marcajes de este empleado en esta fecha
        const dayAtts = weeklyAttendances.filter((att) => {
          if (att.employeeId !== emp.id && att.employee?.dni !== emp.dni) return false;
          const attDate = new Date(att.timestamp).toISOString().split('T')[0];
          return attDate === dateStr;
        });

        const checkIn = dayAtts.find((a) => a.type === 'CHECK_IN');
        const checkOut = dayAtts.find((a) => a.type === 'CHECK_OUT');

        let isLate = false;
        let diffMinutes = 0;
        const expectedTime = emp.expectedCheckInTime || '08:00';

        if (checkIn) {
          totalWorkedDays++;
          const checkInDate = new Date(checkIn.timestamp);
          const [expH, expM] = String(expectedTime).split(':').map(Number);
          const actualMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
          const scheduledMinutes = (isNaN(expH) ? 8 : expH) * 60 + (isNaN(expM) ? 0 : expM);

          diffMinutes = actualMinutes - scheduledMinutes;
          if (diffMinutes > 0) {
            isLate = true;
            totalLateCount++;
            totalLateMinutes += diffMinutes;
          }
        }

        return {
          day,
          dateStr,
          isToday,
          isFuture,
          isOffDay,
          checkIn,
          checkOut,
          isLate,
          diffMinutes,
          expectedTime,
        };
      });

      const totalPenaltyAmount = totalLateCount * penaltyPerLate;

      return {
        employee: emp,
        daysDetails,
        totalWorkedDays,
        totalLateCount,
        totalLateMinutes,
        totalPenaltyAmount,
      };
    });
  }, [employees, weeklyAttendances, weekDays, todayStr, penaltyPerLate]);

  // Filtrado por buscador y filtro de retrasos
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        `${item.employee.firstName} ${item.employee.lastName} ${item.employee.dni}`
          .toLowerCase()
          .includes(q);

      if (!matchSearch) return false;
      if (onlyLateFilter && item.totalLateCount === 0) return false;

      return true;
    });
  }, [processedData, searchQuery, onlyLateFilter]);

  // Métricas de la semana
  const metrics = useMemo(() => {
    const totalWorkers = processedData.length;
    const totalLateCheckIns = processedData.reduce((acc, p) => acc + p.totalLateCount, 0);
    const workersWithLate = processedData.filter((p) => p.totalLateCount > 0).length;
    const totalPenalties = totalLateCheckIns * penaltyPerLate;
    const totalPresences = processedData.reduce((acc, p) => acc + p.totalWorkedDays, 0);

    return {
      totalWorkers,
      totalLateCheckIns,
      workersWithLate,
      totalPenalties,
      totalPresences,
    };
  }, [processedData, penaltyPerLate]);

  // Copiar resumen de multas al portapapeles
  const handleCopyFinesReport = () => {
    const lateWorkers = processedData.filter((p) => p.totalLateCount > 0);

    const weekLabel = `${weekDays[0].toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
    })} al ${weekDays[6].toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;

    let report = `📋 *CONTROL DE RETRASOS Y MULTAS SEMANALES*\n`;
    report += `📅 Semana: ${weekLabel}\n`;
    report += `🏢 Importadora Rivero\n`;
    report += `💵 Tarifa de Multa: Bs. ${penaltyPerLate} por cada retraso\n`;
    report += `--------------------------------------------------\n`;

    if (lateWorkers.length === 0) {
      report += `✅ ¡Excelente! No se registraron retrasos en esta semana.\n`;
    } else {
      lateWorkers.forEach((w, idx) => {
        report += `${idx + 1}. *${w.employee.firstName} ${w.employee.lastName}* (C.I. ${w.employee.dni})\n`;
        report += `   • ${w.totalLateCount} retraso(s) (+${w.totalLateMinutes} min acumulados)\n`;
        report += `   • *Multa a descontar: Bs. ${w.totalPenaltyAmount}*\n\n`;
      });
      report += `--------------------------------------------------\n`;
      report += `💰 *TOTAL MULTAS A DESCONTAR: Bs. ${metrics.totalPenalties}*\n`;
    }

    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3500);
  };

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const start = new Date(weekDays[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekDays[6]);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  }, [weekDays]);

  return (
    <div className="space-y-6">
      {/* 1. Header de Navegación Semanal & Ajuste de Multa */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Calendario Semanal & Sábana de Asistencias
            </h2>
            {isCurrentWeek && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                Semana en Curso
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Supervisa de un solo vistazo las asistencias de lunes a domingo y el cobro automático de multas por retrasos.
          </p>
        </div>

        {/* Controles de Semana */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-44 text-center">
              {weekDays[0].toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })} –{' '}
              {weekDays[6].toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>

            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="Semana Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleThisWeek}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isCurrentWeek
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Esta Semana
          </button>

          <button
            onClick={loadWeekData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            title="Recargar Asistencias"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas Semanales y Control de Multa (10 Bs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Multa por Retraso Configurable */}
        <div className="glass-panel p-4 rounded-3xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
              Multa por Retraso
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">
              Bs. {penaltyPerLate}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">/ por llegada tarde</span>
          </div>

          {/* Selector Rápido de Tarifa de Multa */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Tarifa:</span>
            {[5, 10, 15, 20].map((rate) => (
              <button
                key={rate}
                onClick={() => setPenaltyPerLate(rate)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all cursor-pointer ${
                  penaltyPerLate === rate
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-900 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                {rate} Bs
              </button>
            ))}
          </div>
        </div>

        {/* Total Multas a Cobrar en la Semana */}
        <div className="glass-panel p-4 rounded-3xl border border-rose-300 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-rose-700 dark:text-rose-400 tracking-wider">
              Total Multas a Descontar
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">
            {formatMoney(metrics.totalPenalties)}
          </div>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-1">
            {metrics.workersWithLate} {metrics.workersWithLate === 1 ? 'trabajador con retraso' : 'trabajadores con retrasos'}
          </p>
        </div>

        {/* Total Retrasos Semana */}
        <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Retrasos Detectados
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalLateCheckIns}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            En los 7 días de la semana seleccionada
          </p>
        </div>

        {/* Total Días Asistidos */}
        <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Asistencias Registradas
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.totalPresences}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            De {metrics.totalWorkers} trabajadores activos
          </p>
        </div>
      </div>

      {/* 3. Barra de Búsqueda, Filtros y Botón de Copiar Reporte */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Input Buscador */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o C.I...."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filtro Solo con Retrasos */}
          <button
            onClick={() => setOnlyLateFilter((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              onlyLateFilter
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Solo con Retrasos ({metrics.workersWithLate})</span>
          </button>
        </div>

        {/* Botón Copiar Reporte de Multas */}
        <button
          onClick={handleCopyFinesReport}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          title="Copiar lista de multas calculadas para liquidar en nómina semanal"
        >
          {copiedReport ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Reporte de Multas Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Multas para Nómina ({formatMoney(metrics.totalPenalties)})</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Tabla Matriz Semanal (Sábana de Asistencias) */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              No se encontraron registros con los filtros actuales
            </h4>
            <p className="text-xs text-slate-400">
              Intenta limpiar el buscador o desactivar el filtro de solo retrasos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[200px]">Trabajador & Turno</th>

                  {/* Columnas de Días (Lunes a Domingo) */}
                  {weekDays.map((day, idx) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = dateStr === todayStr;
                    return (
                      <th
                        key={idx}
                        className={`py-3 px-3 text-center min-w-[110px] ${
                          isToday
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-x border-brand-500/30'
                            : ''
                        }`}
                      >
                        <span className="block font-black text-xs">
                          {dayNamesShort[idx]}
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          {day.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })}
                        </span>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded-md bg-brand-500 text-white text-[8px] font-black">
                            HOY
                          </span>
                        )}
                      </th>
                    );
                  })}

                  {/* Columnas de Resumen Semanal */}
                  <th className="py-3 px-3 text-center min-w-[80px]">Días</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Retrasos</th>
                  <th className="py-3 px-4 text-right min-w-[110px] bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                    Multa Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredData.map(({ employee, daysDetails, totalWorkedDays, totalLateCount, totalLateMinutes, totalPenaltyAmount }) => {
                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Columna Trabajador */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-xs flex items-center justify-center shrink-0 border border-brand-500/20">
                            {employee.firstName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                              {employee.firstName} {employee.lastName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                C.I. {employee.dni}
                              </span>
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md border border-amber-500/20">
                                Entrada: {employee.expectedCheckInTime || '08:00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Celdas de Días de la Semana */}
                      {daysDetails.map((detail, idx) => {
                        const { isToday, isFuture, isOffDay, checkIn, checkOut, isLate, diffMinutes } = detail;

                        return (
                          <td
                            key={idx}
                            className={`py-2.5 px-2 text-center align-middle ${
                              isToday ? 'bg-brand-500/5 border-x border-brand-500/20' : ''
                            }`}
                          >
                            {checkIn ? (
                              // Marcó entrada
                              <div className="space-y-1 inline-block text-left w-full max-w-[95px]">
                                {isLate ? (
                                  <div className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono font-black text-[11px]">
                                        {new Date(checkIn.timestamp).toLocaleTimeString('es-BO', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                      <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-black mt-0.5">
                                      <span className="text-amber-700 dark:text-amber-300">+{diffMinutes}m</span>
                                      <span className="text-rose-600 dark:text-rose-400 bg-rose-500/15 px-1 rounded">
                                        -{penaltyPerLate} Bs
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-mono font-black text-[11px]">
                                        {new Date(checkIn.timestamp).toLocaleTimeString('es-BO', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                    </div>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                      Puntual
                                    </span>
                                  </div>
                                )}

                                {/* Datos de salida o enlace a mapa */}
                                <div className="flex items-center justify-between px-0.5 text-[9px] text-slate-400">
                                  {checkOut ? (
                                    <span title="Hora de Salida" className="font-mono">
                                      S: {new Date(checkOut.timestamp).toLocaleTimeString('es-BO', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  ) : (
                                    <span className="italic">Sin salida</span>
                                  )}

                                  {checkIn.latitude && checkIn.longitude && (
                                    <a
                                      href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Ver GPS de entrada en Google Maps"
                                      className="text-slate-400 hover:text-brand-500"
                                    >
                                      <MapPin className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : isFuture ? (
                              // Día futuro
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            ) : isOffDay ? (
                              // Día libre
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold">
                                Libre
                              </span>
                            ) : isToday ? (
                              // Es hoy y aún no marcó
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                Sin marcar
                              </span>
                            ) : (
                              // Pasó el día y no marcó
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/20">
                                Falta
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Resumen Días */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {totalWorkedDays}
                      </td>

                      {/* Resumen Retrasos */}
                      <td className="py-3 px-3 text-center">
                        {totalLateCount > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{totalLateCount} (+{totalLateMinutes}m)</span>
                          </div>
                        ) : (
                          <span className="text-emerald-500 font-bold text-[11px]">0</span>
                        )}
                      </td>

                      {/* Resumen Multa Total */}
                      <td className="py-3 px-4 text-right bg-rose-50/30 dark:bg-rose-950/10">
                        {totalPenaltyAmount > 0 ? (
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-rose-500 text-white font-mono font-black text-xs shadow-xs">
                            Bs. {totalPenaltyAmount}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">Bs. 0</span>
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

      {/* Leyenda y Explicación */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 dark:text-slate-300">Leyenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Puntual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Retraso (Multa {penaltyPerLate} Bs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Falta</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span>Día Libre / Pendiente</span>
          </div>
        </div>

        <span className="text-[11px] italic">
          * Las multas se calculan multiplicando los retrasos registrados por la tarifa vigente (Bs. {penaltyPerLate}).
        </span>
      </div>
    </div>
  );
};
