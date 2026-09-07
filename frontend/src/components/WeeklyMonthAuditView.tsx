import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  AlertTriangle,
  Layers,
  ChevronRight,
  TrendingUp,
  Info,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { useApp, deduplicateEmployees } from '../context/AppContext';
import { PayrollRecord, PayrollPeriod } from '../types';
import { exportWeeklyMonthAuditToExcel } from '../lib/excelExport';

interface WeeklyMonthAuditViewProps {
  onOpenPaymentQR?: (record: PayrollRecord, period: PayrollPeriod) => void;
  onOpenPayslip?: (record: PayrollRecord, period: PayrollPeriod) => void;
}

// Función para calcular las semanas de pago (domingos) de un mes
const getMonthSundays = (year: number, monthIndex: number) => {
  const sundays: { dateStr: string; dayNumber: number; weekIndex: number }[] = [];
  const date = new Date(year, monthIndex, 1);
  let weekIndex = 1;

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === 0) {
      // Domingo
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      sundays.push({
        dateStr: `${y}-${m}-${d}`,
        dayNumber: date.getDate(),
        weekIndex,
      });
      weekIndex++;
    }
    date.setDate(date.getDate() + 1);
  }

  return sundays;
};

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const WeeklyMonthAuditView: React.FC<WeeklyMonthAuditViewProps> = ({
  onOpenPaymentQR,
  onOpenPayslip,
}) => {
  const { employees, periods, payrollRecords, currencySymbol } = useApp();

  // Mes seleccionado (por defecto Septiembre 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // 8 = Septiembre (0-indexed)

  // Domingos/Cortes de pago en el mes
  const monthSundays = useMemo(
    () => getMonthSundays(selectedYear, selectedMonthIndex),
    [selectedYear, selectedMonthIndex]
  );

  const totalWeeksInMonth = monthSundays.length >= 5 ? 5 : 4;
  const monthName = MONTH_NAMES[selectedMonthIndex];
  const monthLabel = `${monthName} ${selectedYear}`;

  // Filtrar trabajadores con modalidad semanal
  const weeklyEmployees = useMemo(() => {
    return deduplicateEmployees(
      employees.filter(
        (e) => e.paymentFrequency === 'SEMANAL' && e.status === 'ACTIVE'
      )
    );
  }, [employees]);

  // Obtener los periodos semanales registrados en el sistema
  const weeklyPeriods = useMemo(() => {
    return periods.filter((p) => p.frequency === 'SEMANAL');
  }, [periods]);

  // Mapear cada semana (1 a 4 o 5) a los periodos y registros correspondientes
  const auditMatrix = useMemo(() => {
    return weeklyEmployees.map((emp) => {
      // Sueldo base semanal
      const baseWeekly = Number(emp.baseSalary);
      const totalMonthBudget = baseWeekly * totalWeeksInMonth;

      // Buscar registros del trabajador en los periodos semanales
      const empRecords = payrollRecords.filter((r) => r.employeeId === emp.id);

      // Mapear a cada una de las semanas del mes
      const weeksData = [];
      let totalEarnedInMonth = 0;
      let totalPaidInMonth = 0;
      let paidWeeksCount = 0;

      for (let w = 1; w <= totalWeeksInMonth; w++) {
        const sunday = monthSundays[w - 1];
        const weekDateLabel = sunday ? `Dom ${sunday.dayNumber}` : `Sem ${w}`;

        // Intentar emparejar con un periodo semanal existente
        let matchedPeriod: PayrollPeriod | undefined = weeklyPeriods[w - 1];
        let matchedRecord = matchedPeriod
          ? empRecords.find((r) => r.periodId === matchedPeriod.id)
          : undefined;

        // Si no se encuentra por índice, buscar por mes/año en código o nombre
        if (!matchedRecord && empRecords.length > 0) {
          if (w === 1 && empRecords[0]) {
            matchedRecord = empRecords[0];
            matchedPeriod = weeklyPeriods.find(
              (p) => p.id === matchedRecord?.periodId
            );
          }
        }

        const isPaid = matchedRecord?.status === 'PAID';
        const netAmount = matchedRecord
          ? Number(matchedRecord.netAmount)
          : baseWeekly;

        if (matchedRecord) {
          totalEarnedInMonth += netAmount;
          if (isPaid) {
            totalPaidInMonth += netAmount;
            paidWeeksCount++;
          }
        }

        weeksData.push({
          weekIndex: w,
          weekDateLabel,
          period: matchedPeriod,
          record: matchedRecord,
          netAmount,
          isPaid,
          status: matchedRecord
            ? matchedRecord.status
            : ('UNRECORDED' as const),
        });
      }

      const totalPendingInMonth = Math.max(
        0,
        totalMonthBudget - totalPaidInMonth
      );
      const compliancePercent =
        totalWeeksInMonth > 0
          ? Math.round((paidWeeksCount / totalWeeksInMonth) * 100)
          : 0;

      return {
        employee: emp,
        dni: emp.dni,
        fullName: `${emp.lastName}, ${emp.firstName}`,
        position: emp.position,
        baseWeekly,
        weeksData,
        totalMonthGross: totalMonthBudget,
        totalMonthPaid: totalPaidInMonth,
        totalMonthPending: totalPendingInMonth,
        paidWeeksCount,
        compliancePercent,
      };
    });
  }, [
    weeklyEmployees,
    totalWeeksInMonth,
    monthSundays,
    payrollRecords,
    weeklyPeriods,
  ]);

  // Totales generales del mes
  const grandTotalMonthBudget = auditMatrix.reduce(
    (acc, r) => acc + r.totalMonthGross,
    0
  );
  const grandTotalMonthPaid = auditMatrix.reduce(
    (acc, r) => acc + r.totalMonthPaid,
    0
  );
  const grandTotalMonthPending = auditMatrix.reduce(
    (acc, r) => acc + r.totalMonthPending,
    0
  );

  const handleExportExcel = () => {
    exportWeeklyMonthAuditToExcel(
      monthLabel,
      totalWeeksInMonth,
      auditMatrix.map((r) => ({
        dni: r.dni,
        fullName: r.fullName,
        position: r.position,
        baseWeekly: r.baseWeekly,
        weeksData: r.weeksData.map((w) => ({
          weekIndex: w.weekIndex,
          netAmount: w.netAmount,
          status: w.status,
          paymentDate: w.record?.paymentDate,
        })),
        totalMonthGross: r.totalMonthGross,
        totalMonthPaid: r.totalMonthPaid,
        totalMonthPending: r.totalMonthPending,
        paidWeeksCount: r.paidWeeksCount,
      }))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header y Selector de Mes */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Cómputo Mensual por Semanas
              </h2>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  totalWeeksInMonth === 5
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                }`}
              >
                {totalWeeksInMonth} SEMANAS EN ESTE MES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control exacto de cuántas semanas corresponden al mes, cuántas ya
              fueron cobradas por el trabajador y saldo pendiente.
            </p>
          </div>
        </div>

        {/* Controles de Mes y Exportación */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
            className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white shadow-sm focus:outline-none"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>
                {m} {selectedYear}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Descargar matriz mensual completa a Excel"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Banner Informativo de Diagnóstico del Calendario */}
      <div
        className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
          totalWeeksInMonth === 5
            ? 'bg-purple-500/10 border-purple-500/25 text-purple-950 dark:text-purple-200'
            : 'bg-sky-500/10 border-sky-500/25 text-sky-950 dark:text-sky-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl font-black text-sm shrink-0 ${
              totalWeeksInMonth === 5
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
            }`}
          >
            {totalWeeksInMonth} SEMANAS
          </div>
          <div className="text-xs">
            <p className="font-extrabold">
              {monthLabel} tiene exactamente {totalWeeksInMonth} domingos de
              pago ({monthSundays.map((s) => `Dom ${s.dayNumber}`).join(', ')}).
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {totalWeeksInMonth === 5
                ? 'Mes largo de 5 cortes semanales: El presupuesto de nómina para almacén y choferes contempla 5 pagos en total.'
                : 'Mes estándar de 4 cortes semanales: Cada trabajador semanal tiene 4 liquidaciones en el mes.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold opacity-75 block">
            Presupuesto Base Semanal x {totalWeeksInMonth}:
          </span>
          <span className="text-lg font-black font-mono">
            {currencySymbol} {grandTotalMonthBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 4 Tarjetas de Métricas del Mes para Personal Semanal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-purple-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Cortes en {monthName}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {totalWeeksInMonth} Semanas
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalWeeksInMonth === 5 ? 'Mes extendido (5 domingos)' : 'Mes regular (4 domingos)'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-sky-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
            Presupuesto Total Mes
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {currencySymbol} {grandTotalMonthBudget.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {weeklyEmployees.length} trabajadores x {totalWeeksInMonth} semanas
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-emerald-500/5 to-transparent">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Total Efectivamente Pagado
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono mt-1">
            {currencySymbol} {grandTotalMonthPaid.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Sueldos semanales ya cobrados
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-amber-500/5 to-transparent">
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Saldo Pendiente por Pagar
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {currencySymbol} {grandTotalMonthPending.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Por liquidar en lo que resta del mes
          </p>
        </div>
      </div>

      {/* Matriz Visual: Trabajador vs Semanas del Mes */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Matriz de Liquidación por Semanas ({monthLabel})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cada celda muestra el estado del salario de esa semana. Puedes hacer clic en Registrar Pago si alguna semana está pendiente.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" /> Pendiente
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              ⚪ Por Liquidar
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Trabajador & Cargo</th>
                <th className="px-3 py-3.5 text-right">Sueldo Base Semanal</th>
                <th className="px-3 py-3.5 text-center">Semana 1</th>
                <th className="px-3 py-3.5 text-center">Semana 2</th>
                <th className="px-3 py-3.5 text-center">Semana 3</th>
                <th className="px-3 py-3.5 text-center">Semana 4</th>
                {totalWeeksInMonth === 5 && (
                  <th className="px-3 py-3.5 text-center bg-purple-500/10 text-purple-700 dark:text-purple-300">
                    Semana 5 (Corte Extendido)
                  </th>
                )}
                <th className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">
                  Total Mes Cobrado
                </th>
                <th className="px-4 py-3.5 text-center">Progreso Semanal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {auditMatrix.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalWeeksInMonth === 5 ? 9 : 8}
                    className="p-8 text-center text-slate-400"
                  >
                    No hay trabajadores con modalidad de cobro semanal registrados.
                  </td>
                </tr>
              ) : (
                auditMatrix.map((row) => {
                  const isFullyPaid = row.paidWeeksCount === totalWeeksInMonth;

                  return (
                    <tr
                      key={row.employee.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {row.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-mono">DNI: {row.dni}</span> &bull;
                          <span>{row.position}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {currencySymbol} {row.baseWeekly.toFixed(2)}
                      </td>

                      {/* Columnas de Semanas 1 a 4 (o 5) */}
                      {row.weeksData.map((w) => {
                        const hasRecord = !!w.record;
                        const isPaid = w.isPaid;

                        return (
                          <td key={w.weekIndex} className="px-3 py-3.5 text-center">
                            {hasRecord ? (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                                    isPaid
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  }`}
                                >
                                  {isPaid ? (
                                    <>
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      {currencySymbol} {w.netAmount.toFixed(0)}
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-2.5 h-2.5" />
                                      {currencySymbol} {w.netAmount.toFixed(0)}
                                    </>
                                  )}
                                </span>

                                {isPaid ? (
                                  <span className="text-[9px] text-slate-400">
                                    {w.record?.paymentDate
                                      ? w.record.paymentDate.slice(5)
                                      : 'Pagado'}
                                  </span>
                                ) : (
                                  onOpenPaymentQR &&
                                  w.record && (
                                    <button
                                      onClick={() => {
                                        const p = w.period || periods[0];
                                        if (p && w.record) {
                                          onOpenPaymentQR(w.record, p);
                                        }
                                      }}
                                      className="text-[9px] font-bold text-emerald-600 hover:text-emerald-500 underline cursor-pointer"
                                      title="Pagar esta semana pendiente"
                                    >
                                      Pagar
                                    </button>
                                  )
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {currencySymbol} {row.baseWeekly.toFixed(0)}
                                <span className="block text-[8px] text-slate-400/80">
                                  Por liquidar
                                </span>
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Mes Cobrado */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {currencySymbol} {row.totalMonthPaid.toFixed(2)}
                        </div>
                        {row.totalMonthPending > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                            Falta: {currencySymbol}{' '}
                            {row.totalMonthPending.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Progreso Semanal */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              isFullyPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {row.paidWeeksCount} / {totalWeeksInMonth} semanas
                          </span>
                          <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFullyPaid ? 'bg-emerald-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${row.compliancePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default WeeklyMonthAuditView;
