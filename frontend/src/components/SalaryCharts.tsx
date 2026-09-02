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
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // 1. CÁLCULO 100% REAL DE SUELDOS DESDE LOS TRABAJADORES Y PLANILLAS
  const totalBaseActive = employees.reduce((acc, emp) => {
    // Si es semanal, se multiplica por 4 semanas para calcular el mes
    const monthlyEquivalent = emp.paymentFrequency === 'SEMANAL' ? emp.baseSalary * 4 : emp.baseSalary;
    return acc + Number(monthlyEquivalent);
  }, 0);

  const totalBonusesActive = payrollRecords.reduce((acc, rec) => acc + Number(rec.bonusesAmount), 0);
  const totalOvertimeActive = payrollRecords.reduce((acc, rec) => acc + Number(rec.overtimeAmount), 0);
  const totalVariables = totalBonusesActive + totalOvertimeActive;

  // Si hay periodos reales cerrados o abiertos, se calculan por periodo real
  const chartData = [
    {
      month: 'Planilla Actual',
      base: totalBaseActive,
      variable: totalVariables,
      total: totalBaseActive + totalVariables,
    },
  ];

  // Si hay más periodos registrados, agregarlos dinámicamente
  periods.forEach((p) => {
    const pRecords = payrollRecords.filter((r) => r.periodId === p.id);
    if (pRecords.length > 0) {
      const pBase = pRecords.reduce((acc, r) => acc + Number(r.baseSalary), 0);
      const pVar = pRecords.reduce((acc, r) => acc + Number(r.overtimeAmount) + Number(r.bonusesAmount), 0);
      
      // Evitar duplicar
      if (!chartData.some((c) => c.month === p.name.split(' ')[0] + ' ' + (p.name.split(' ')[1] || ''))) {
        chartData.unshift({
          month: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
          base: pBase,
          variable: pVar,
          total: pBase + pVar,
        });
      }
    }
  });

  const maxVal = Math.max(...chartData.map((d) => d.total), 1000);

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
      <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-sm">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-extrabold text-slate-900 dark:text-white">
                  Flujo Salarial en Tiempo Real
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculado directamente de tus trabajadores y planillas activas.
                </p>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/40">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Sueldo Base</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800/40">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Extras / Bonos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visualizador de Barras en Tiempo Real */}
        <div className="pt-4">
          {employees.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
              <p className="font-bold">Aún no hay sueldos registrados.</p>
              <p className="text-[11px] text-slate-500">
                Registra a tus trabajadores para ver el gráfico de sueldos en tiempo real.
              </p>
            </div>
          ) : (
            <div className="h-44 flex items-end justify-center gap-8 px-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              {chartData.map((d, index) => {
                const baseHeight = Math.max(20, (d.base / maxVal) * 140);
                const varHeight = d.variable > 0 ? Math.max(15, (d.variable / maxVal) * 140) : 10;
                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip flotante */}
                    {isHovered && (
                      <div className="absolute -top-14 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap z-20 animate-in fade-in zoom-in-95 font-sans">
                        <div className="font-black text-emerald-400">
                          Total: {currencySymbol} {d.total.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Base: {currencySymbol} {d.base.toLocaleString()} &bull; Var: +{currencySymbol} {d.variable.toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      {/* Barra Sueldo Base */}
                      <div
                        style={{ height: `${baseHeight}px` }}
                        className="w-12 bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 rounded-t-xl shadow-md transition-all duration-300 group-hover:brightness-110"
                      />

                      {/* Barra Variables */}
                      <div
                        style={{ height: `${varHeight}px` }}
                        className="w-8 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-t-xl shadow-md transition-all duration-300 group-hover:brightness-110"
                      />
                    </div>

                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer del gráfico */}
        <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-slate-500 dark:text-slate-400">
            Total Salarios Activos:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
              {currencySymbol} {totalBaseActive.toLocaleString()}
            </strong>
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            {employees.length} Trabajador(es) Activo(s)
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
