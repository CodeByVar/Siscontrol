import React from 'react';
import {
  Users,
  HandCoins,
  CalendarDays,
  CalendarRange,
  ArrowUpRight,
  TrendingUp,
  Plus,
  QrCode,
  DollarSign,
  Wallet,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useApp, deduplicateEmployees } from '../context/AppContext';
import { SalaryCharts } from './SalaryCharts';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: NavTab) => void;
  openAddEmployeeModal: () => void;
  openAddAdvanceModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  openAddEmployeeModal,
  openAddAdvanceModal,
}) => {
  const { employees, advances, periods, payrollRecords, currentRole, currencySymbol, formatMoney } = useApp();

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  // Cálculos 100% REALES basados en tus trabajadores registrados (Sin duplicados por C.I.)
  const activeEmployees = deduplicateEmployees(employees.filter((e) => e.status === 'ACTIVE'));
  const weeklyEmployees = activeEmployees.filter((e) => e.paymentFrequency === 'SEMANAL');
  const monthlyEmployees = activeEmployees.filter((e) => e.paymentFrequency === 'MENSUAL');

  const pendingAdvances = advances.filter((a) => a.status === 'PENDING');
  const totalPendingAdvances = pendingAdvances.reduce((acc, a) => acc + Number(a.amount), 0);

  const weeklyBaseSum = weeklyEmployees.reduce((acc, e) => acc + Number(e.baseSalary), 0);
  const monthlyBaseSum = monthlyEmployees.reduce((acc, e) => acc + Number(e.baseSalary), 0);
  const totalMonthlyBudget = weeklyBaseSum * 4 + monthlyBaseSum;

  const openWeeklyPeriod = periods.find((p) => p.frequency === 'SEMANAL' && p.status === 'OPEN');
  const openMonthlyPeriod = periods.find((p) => p.frequency === 'MENSUAL' && p.status === 'OPEN');

  // Detección de Deudas Pendientes de Semanas Anteriores
  // ÚNICAMENTE si ya se sobrepasó la fecha límite de pago (endDate < hoy) y el pago sigue pendiente
  const todayStr = new Date().toISOString().split('T')[0];
  const currentWeekPeriod = periods.find(
    (p) =>
      p.frequency === 'SEMANAL' &&
      p.id !== 'per-sem-actual' &&
      p.periodNumber !== 36 &&
      todayStr >= p.startDate &&
      todayStr <= p.endDate
  );

  const pastUnpaidWeeklyRecords = payrollRecords.filter((rec) => {
    const emp =
      employees.find((e) => e.id === rec.employeeId || (rec.employee?.dni && e.dni === rec.employee.dni)) ||
      rec.employee;
    if (emp?.paymentFrequency !== 'SEMANAL' || rec.status === 'PAID') {
      return false;
    }
    const recPeriod = periods.find((p) => p.id === rec.periodId);
    if (!recPeriod) return false;
    // ÚNICAMENTE si ya venció el último día de esa semana (Domingo ya pasó en el calendario)
    return recPeriod.endDate < todayStr;
  });

  const totalPastUnpaidDebt = pastUnpaidWeeklyRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              Control de Nóminas & Salarios
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 font-normal leading-relaxed">
              Monitorea el presupuesto mensual, autoriza pagos directos por QR bancario y gestiona anticipos del personal en tiempo real.
            </p>
          </div>

          {/* Quick Action Buttons */}
          {isBossOrAdmin && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={openAddAdvanceModal}
                className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-800/90 hover:bg-slate-700/90 text-white border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <HandCoins className="w-4 h-4 text-amber-400" />
                <span>Registrar Adelanto</span>
              </button>

              <button
                onClick={openAddEmployeeModal}
                className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Registrar Trabajador</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🚨 Alerta de Control: SOLO se muestra si se sobrepasa del último día de pago de semanas anteriores */}
      {pastUnpaidWeeklyRecords.length > 0 ? (
        <div
          onClick={() => setActiveTab('weekly')}
          className="p-4 sm:p-5 rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-red-950 dark:text-red-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-red-500/15 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-tight">
                ⚠️ Alerta de Control: {pastUnpaidWeeklyRecords.length} Pago(s) Semanal(es) Atrasado(s) de Semanas Previas
              </h4>
              <p className="text-xs text-red-600/90 dark:text-red-300/80">
                Se sobrepasó la fecha límite de pago y hay salarios semanales pendientes de liquidar por un total de <strong>{currencySymbol} {totalPastUnpaidDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>. Haz clic aquí para liquidarlos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm transition-all">
              Liquidar Deudas <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      ) : (
        /* 🟢 Tarjeta Informativa de la Semana en Curso cuando todo está al día */
        <div
          onClick={() => setActiveTab('weekly')}
          className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-emerald-500/15 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {currentWeekPeriod ? `${currentWeekPeriod.name} en curso` : 'Semana 2 en curso'}
                </span>
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  Salarios Semanales al Día (Semana 1 ya pagada)
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                {currentWeekPeriod
                  ? `Periodo del ${currentWeekPeriod.startDate} al ${currentWeekPeriod.endDate}. Cierre y pago programado para el Domingo.`
                  : 'Nóminas al día sin pagos atrasados.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all">
              Ver Nómina Semanal <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Trabajadores Activos */}
        <div
          onClick={() => setActiveTab('employees')}
          className="glass-panel p-5 rounded-3xl border-t-4 border-t-purple-500 border-x border-b border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-wider text-purple-600 dark:text-purple-400 uppercase">
              Padrón de Personal
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {activeEmployees.length}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>{weeklyEmployees.length} Semanales</span>
            <span>{monthlyEmployees.length} Mensuales</span>
          </div>
        </div>

        {/* 2. Nómina Semanal Activa */}
        <div
          onClick={() => setActiveTab('weekly')}
          className="glass-panel p-5 rounded-3xl border-t-4 border-t-sky-500 border-x border-b border-slate-200 dark:border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-wider text-sky-600 dark:text-sky-400 uppercase">
              Sueldos Semanales (7d)
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatMoney(weeklyBaseSum)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>{weeklyEmployees.length} Choferes & Almacén</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">&rarr; Liquidar</span>
          </div>
        </div>

        {/* 3. Nómina Mensual Activa */}
        <div
          onClick={() => setActiveTab('monthly')}
          className="glass-panel p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
              Sueldos Mensuales (30d)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CalendarRange className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatMoney(monthlyBaseSum)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>{monthlyEmployees.length} Oficina & Ventas</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">&rarr; Liquidar</span>
          </div>
        </div>

        {/* 4. Adelantos Pendientes de Descuento */}
        <div
          onClick={() => setActiveTab('advances')}
          className="glass-panel p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase">
              Adelantos por Descontar
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatMoney(totalPendingAdvances)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span>{pendingAdvances.length} vales solicitados</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">&rarr; Ver Vales</span>
          </div>
        </div>
      </div>

      {/* Gráficos en Tiempo Real */}
      <SalaryCharts />
    </div>
  );
};
