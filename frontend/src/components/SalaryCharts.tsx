import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  DollarSign,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SalaryCharts: React.FC = () => {
  const { employees, payrollRecords, periods, currencySymbol } = useApp();
  const [chartTab, setChartTab] = useState<'WEEKS' | 'MONTHLY'>('WEEKS');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. CÁLCULO REAL DE SUELDOS
  const weeklyEmployees = employees.filter((e) => e.status === 'ACTIVE' && e.paymentFrequency === 'SEMANAL');
  const monthlyEmployees = employees.filter((e) => e.status === 'ACTIVE' && e.paymentFrequency === 'MENSUAL');

  const weeklyBaseSum = weeklyEmployees.reduce((acc, e) => acc + Number(e.baseSalary), 0);
  const monthlyBaseSum = monthlyEmployees.reduce((acc, e) => acc + Number(e.baseSalary), 0);

  const totalBaseActive = weeklyBaseSum * 4 + monthlyBaseSum;
  const totalBonusesActive = payrollRecords.reduce((acc, rec) => acc + Number(rec.bonusesAmount), 0);
  const totalOvertimeActive = payrollRecords.reduce((acc, rec) => acc + Number(rec.overtimeAmount), 0);
  const totalVariables = totalBonusesActive + totalOvertimeActive;

  // Filtrar periodos semanales limpios y ordenados cronológicamente
  const weeklyPeriods = periods
    .filter(
      (p) =>
        p.frequency === 'SEMANAL' &&
        p.id !== 'per-sem-actual' &&
        p.code !== 'SEM-ACTUAL' &&
        p.periodNumber !== 36
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Datos para la pestaña de Semanas del Mes (1 a 5)
  const weeklyChartData = weeklyPeriods.map((p, idx) => {
    const isCurrent = todayStr >= p.startDate && todayStr <= p.endDate;
    const isSem1 = p.id === 'per-sem-1-sept-2026' || idx === 0;

    const pRecords = payrollRecords.filter((r) => r.periodId === p.id);
    const pBase = pRecords.reduce((acc, r) => acc + Number(r.baseSalary), 0);
    const pVar = pRecords.reduce(
      (acc, r) => acc + Number(r.overtimeAmount) + Number(r.bonusesAmount),
      0
    );
    const paidCount = pRecords.filter((r) => r.status === 'PAID').length;

    const startParts = p.startDate.split('-');
    const endParts = p.endDate.split('-');
    const dateRangeLabel = `${startParts[2]}/${startParts[1]} - ${endParts[2]}/${endParts[1]}`;

    const effectiveBase = pBase > 0 ? pBase : weeklyBaseSum;
    const effectiveTotal = effectiveBase + pVar;

    const isPaid = isSem1 || (pRecords.length > 0 && paidCount === pRecords.length);

    return {
      id: p.id,
      name: p.name,
      shortLabel: `Sem ${idx + 1}`,
      dateRange: dateRangeLabel,
      base: effectiveBase,
      variable: pVar,
      total: effectiveTotal,
      isCurrent,
      isPaid,
      statusLabel: isPaid ? 'Pagada ✓' : isCurrent ? '🟢 En curso' : 'Programada',
    };
  });

  // Datos para la pestaña Consolidada Mensual
  const monthlyChartData = [
    {
      id: 'choferes',
      name: 'Choferes & Almacén',
      shortLabel: 'Semanal (Mes)',
      dateRange: `${weeklyEmployees.length} operativos`,
      base: weeklyBaseSum * 4,
      variable: totalVariables,
      total: weeklyBaseSum * 4 + totalVariables,
      isCurrent: false,
      isPaid: false,
      statusLabel: '4 Semanas',
    },
    {
      id: 'oficina',
      name: 'Oficina & Ventas',
      shortLabel: 'Mensual Fijo',
      dateRange: `${monthlyEmployees.length} administrativos`,
      base: monthlyBaseSum,
      variable: 0,
      total: monthlyBaseSum,
      isCurrent: false,
      isPaid: false,
      statusLabel: 'Fijo 30 Días',
    },
    {
      id: 'total',
      name: 'Presupuesto Total',
      shortLabel: 'Total Planilla',
      dateRange: `${employees.length} activos`,
      base: totalBaseActive,
      variable: totalVariables,
      total: totalBaseActive + totalVariables,
      isCurrent: true,
      isPaid: false,
      statusLabel: 'Mes Completo',
    },
  ];

  const currentChartData = chartTab === 'WEEKS' ? weeklyChartData : monthlyChartData;
  const maxVal = Math.max(...currentChartData.map((d) => d.total), 1000);

  // 2. DESGLOSE REAL POR DEPARTAMENTO
  const totalLogistica = employees
    .filter((e) => e.department === 'LOGISTICA')
    .reduce((acc, e) => acc + (e.paymentFrequency === 'SEMANAL' ? e.baseSalary * 4 : e.baseSalary), 0);

  const totalVentas = employees
    .filter((e) => e.department === 'VENTAS')
    .reduce((acc, e) => acc + (e.paymentFrequency === 'SEMANAL' ? e.baseSalary * 4 : e.baseSalary), 0);

  const totalOficina = employees
    .filter((e) => e.department === 'OFICINA')
    .reduce((acc, e) => acc + (e.paymentFrequency === 'SEMANAL' ? e.baseSalary * 4 : e.baseSalary), 0);

  const grandTotalDept = totalLogistica + totalVentas + totalOficina || 1;

  const pctLogistica = Math.round((totalLogistica / grandTotalDept) * 100);
  const pctVentas = Math.round((totalVentas / grandTotalDept) * 100);
  const pctOficina = Math.round((totalOficina / grandTotalDept) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Gráfico de Barras: Flujo Salarial Real */}
      <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-sm overflow-hidden">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white">
                  Flujo Salarial en Tiempo Real
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {chartTab === 'WEEKS'
                    ? 'Proyección semanal de sueldos y horas extras.'
                    : 'Cálculo consolidado mensual (Semanal vs Mensual).'}
                </p>
              </div>
            </div>

            {/* Pestañas para alternar entre Semanal y Mensual */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartTab('WEEKS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartTab === 'WEEKS'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semanas (1 a 5)
              </button>
              <button
                type="button"
                onClick={() => setChartTab('MONTHLY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chartTab === 'MONTHLY'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Consolidado Mes
              </button>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-3 text-xs mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/40 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Sueldo Base</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800/40 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Extras / Bonos</span>
            </div>
          </div>
        </div>

        {/* Visualizador de Barras en Tiempo Real */}
        <div className="pt-2">
          {employees.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="font-bold">Aún no hay sueldos registrados.</p>
              <p className="text-[11px] text-slate-500">
                Registra a tus trabajadores para ver el gráfico de sueldos en tiempo real.
              </p>
            </div>
          ) : (
            <div className="h-52 flex items-end justify-between sm:justify-around gap-2 px-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
              {currentChartData.map((d, index) => {
                const baseHeight = Math.max(30, (d.base / maxVal) * 135);
                const varHeight = d.variable > 0 ? Math.max(15, (d.variable / maxVal) * 135) : 8;
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={d.id || index}
                    className={`flex flex-col items-center gap-1.5 group relative cursor-pointer flex-1 max-w-28 p-1.5 rounded-2xl transition-all ${
                      d.isCurrent
                        ? 'bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip flotante */}
                    {isHovered && (
                      <div className="absolute -top-14 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap z-30 animate-in fade-in zoom-in-95 font-sans">
                        <div className="font-black text-emerald-400">
                          {d.name}: {currencySymbol} {d.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Base: {currencySymbol} {d.base.toLocaleString()} &bull; Var: +{currencySymbol}{' '}
                          {d.variable.toLocaleString()} ({d.statusLabel})
                        </div>
                      </div>
                    )}

                    {/* Estado Pill arriba de la barra */}
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border truncate max-w-full block text-center ${
                        d.isPaid
                          ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                          : d.isCurrent
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {d.statusLabel}
                    </span>

                    {/* Barras de datos */}
                    <div className="flex items-end gap-1.5 pt-1">
                      {/* Barra Sueldo Base */}
                      <div
                        style={{ height: `${baseHeight}px` }}
                        className={`w-6 sm:w-8 rounded-t-xl shadow-sm transition-all duration-300 group-hover:brightness-110 ${
                          d.isCurrent
                            ? 'bg-gradient-to-t from-sky-600 via-sky-500 to-sky-400 ring-2 ring-sky-400/40'
                            : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400'
                        }`}
                      />

                      {/* Barra Variables */}
                      <div
                        style={{ height: `${varHeight}px` }}
                        className="w-4 sm:w-5 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t-xl shadow-sm transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>

                    {/* Etiquetas inferiores */}
                    <div className="text-center mt-1">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">
                        {d.shortLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {d.dateRange}
                      </span>
                      <span className="text-[11px] font-black font-mono text-indigo-600 dark:text-indigo-400 block mt-0.5">
                        {currencySymbol} {d.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del gráfico */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400">
            Nómina Semanal Promedio:{' '}
            <strong className="text-sky-600 dark:text-sky-400 font-mono font-bold">
              {currencySymbol} {weeklyBaseSum.toLocaleString()} / sem
            </strong>{' '}
            &bull; Mensual:{' '}
            <strong className="text-purple-600 dark:text-purple-400 font-mono font-bold">
              {currencySymbol} {monthlyBaseSum.toLocaleString()}
            </strong>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Total Presupuesto:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
              {currencySymbol} {totalBaseActive.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Gráfico Segmentado: Presupuesto Real por Área */}
      <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white">
                Distribución por Área
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Porcentaje del presupuesto mensual por departamento.
              </p>
            </div>
          </div>
        </div>

        {/* Donut Chart Visualizer */}
        <div className="flex items-center justify-center py-2">
          {employees.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
              <p className="font-bold">Sin datos de áreas</p>
            </div>
          ) : (
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background Circle */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#334155" strokeWidth="3" opacity="0.2" />

                {/* Logística Slice */}
                {pctLogistica > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#0284c7"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctLogistica} ${100 - pctLogistica}`}
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                )}

                {/* Ventas Slice */}
                {pctVentas > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctVentas} ${100 - pctVentas}`}
                    strokeDashoffset={`${-pctLogistica}`}
                    className="transition-all duration-500"
                  />
                )}

                {/* Oficina Slice */}
                {pctOficina > 0 && (
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="3.5"
                    strokeDasharray={`${pctOficina} ${100 - pctOficina}`}
                    strokeDashoffset={`${-(pctLogistica + pctVentas)}`}
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {/* Centro con Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {currencySymbol} {grandTotalDept.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Logística / Almacén</span>
            </div>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {currencySymbol} {totalLogistica.toLocaleString()} ({pctLogistica}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Ventas & Comercial</span>
            </div>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {currencySymbol} {totalVentas.toLocaleString()} ({pctVentas}%)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Oficina & Admin</span>
            </div>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              {currencySymbol} {totalOficina.toLocaleString()} ({pctOficina}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
