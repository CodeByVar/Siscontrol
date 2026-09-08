import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  QrCode,
  FileText,
  SlidersHorizontal,
  Plus,
  Truck,
  Clock,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PayrollRecord, PayrollPeriod } from '../types';
import { sendPayslipViaWhatsApp } from '../lib/whatsappGenerator';
import { WeeklyMonthAuditView } from './WeeklyMonthAuditView';

interface WeeklyPayrollViewProps {
  onSelectRecordForDrawer: (record: PayrollRecord, period: PayrollPeriod) => void;
  onOpenPayslip: (record: PayrollRecord, period: PayrollPeriod) => void;
  onOpenAddPeriod: (frequency: 'SEMANAL' | 'MENSUAL') => void;
  onOpenPaymentQR?: (record: PayrollRecord, period: PayrollPeriod) => void;
}

const getWeeklyDeadlineInfo = () => {
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const daysUntilSunday = (7 - currentDayOfWeek) % 7;

  if (daysUntilSunday > 1) {
    return { text: `Faltan ${daysUntilSunday} días (Dom)`, color: 'text-slate-500 dark:text-slate-400 font-medium' };
  } else if (daysUntilSunday === 1) {
    return { text: 'Vence mañana (Sáb)', color: 'text-amber-600 dark:text-amber-400 font-bold' };
  } else {
    return { text: 'Hoy es Domingo de Pago', color: 'text-emerald-600 dark:text-emerald-400 font-bold' };
  }
};

export const WeeklyPayrollView: React.FC<WeeklyPayrollViewProps> = ({
  onSelectRecordForDrawer,
  onOpenPayslip,
  onOpenAddPeriod,
  onOpenPaymentQR,
}) => {
  const {
    periods,
    payrollRecords,
    calculatePeriodPayroll,
    approveAndClosePeriod,
    markRecordAsUnpaid,
    updateRecord,
    currentRole,
    currencySymbol,
  } = useApp();

  const [subTab, setSubTab] = useState<'CURRENT_WEEK' | 'MONTH_AUDIT'>('CURRENT_WEEK');
  const weeklyPeriods = [...periods.filter((p) => p.frequency === 'SEMANAL')]
    .filter((p) => p.id !== 'per-sem-actual' && p.code !== 'SEM-ACTUAL' && p.periodNumber !== 36)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  useEffect(() => {
    if (weeklyPeriods.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isValid = weeklyPeriods.some((p) => p.id === selectedPeriodId);
      if (!selectedPeriodId || !isValid) {
        const currentWeekPeriod = weeklyPeriods.find(
          (p) => todayStr >= p.startDate && todayStr <= p.endDate
        );
        const openPeriod = weeklyPeriods.find((p) => p.status === 'OPEN');
        setSelectedPeriodId(currentWeekPeriod ? currentWeekPeriod.id : openPeriod ? openPeriod.id : weeklyPeriods[0].id);
      }
    }
  }, [weeklyPeriods, selectedPeriodId]);

  const activePeriod = weeklyPeriods.find((p) => p.id === selectedPeriodId) || weeklyPeriods[0];
  const rawRecords = payrollRecords.filter((r) => r.periodId === (activePeriod?.id || ''));
  // Deduplicación estricta por Carnet de Identidad (DNI) para evitar filas dobles
  const activeRecords = rawRecords.filter((rec, index, self) => {
    const key = rec.employee?.dni || rec.employeeId;
    return index === self.findIndex((r) => (r.employee?.dni || r.employeeId) === key);
  });

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  const totalBase = activeRecords.reduce((acc, r) => acc + Number(r.baseSalary), 0);
  const totalAdvances = activeRecords.reduce((acc, r) => acc + Number(r.advancesDeduction), 0);
  const totalOvertime = activeRecords.reduce((acc, r) => acc + Number(r.overtimeAmount), 0);
  const totalNet = activeRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const paidRecordsCount = activeRecords.filter((r) => r.status === 'PAID').length;
  const pendingRecordsCount = activeRecords.filter((r) => r.status !== 'PAID').length;

  // Detección de Deudas Pendientes de Semanas Anteriores (Control de Pagos Atrasados)
  // ÚNICAMENTE periodos que ya cerraron en el pasado (endDate < hoy)
  const todayStr = new Date().toISOString().split('T')[0];
  const pastUnpaidWeeklyRecords = payrollRecords.filter((rec) => {
    if (rec.employee?.paymentFrequency !== 'SEMANAL' || rec.status === 'PAID') {
      return false;
    }
    const recPeriod = periods.find((p) => p.id === rec.periodId);
    if (!recPeriod) return false;
    return recPeriod.status === 'CLOSED' && recPeriod.endDate < todayStr;
  });

  const totalPastUnpaidDebt = pastUnpaidWeeklyRecords.reduce(
    (acc, r) => acc + Number(r.netAmount),
    0
  );

  const deadlineInfo = getWeeklyDeadlineInfo();

  const handleCloseWeek = () => {
    if (pendingRecordsCount > 0) {
      if (
        !confirm(
          `⚠️ Atención: Hay ${pendingRecordsCount} trabajador(es) con pago PENDIENTE en esta semana.\n\nAl cerrar la semana, pasarán a figurar con ALERTA DE DEUDA PENDIENTE para que no pierdas el control y puedas registrar su pago después.\n\n¿Confirmas cerrar la semana actual y abrir la siguiente?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm('¿Deseas cerrar esta semana con todos los pagos al día y pasar a la siguiente?')) {
        return;
      }
    }
    approveAndClosePeriod(activePeriod.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nómina Semanal (Choferes, Almacén y Operativos)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liquidación individual, alerta de deudas atrasadas y cómputo de semanas por mes (4 vs 5 semanas).
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Sub-Pestañas: Semana Activa vs Cómputo Mensual */}
        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setSubTab('CURRENT_WEEK')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'CURRENT_WEEK'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semana en Curso
          </button>
          <button
            onClick={() => setSubTab('MONTH_AUDIT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'MONTH_AUDIT'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cómputo Mensual (4 vs 5 Semanas)
          </button>
        </div>
      </div>

      {/* Renderizar Cómputo Mensual si está activa la sub-pestaña */}
      {subTab === 'MONTH_AUDIT' && (
        <WeeklyMonthAuditView
          onOpenPaymentQR={onOpenPaymentQR}
          onOpenPayslip={onOpenPayslip}
        />
      )}

      {/* Vista de Semana en Curso */}
      {subTab === 'CURRENT_WEEK' && (
        <div className="space-y-6">
          {/* 📅 SELECTOR DE SEMANAS EN BARRITAS INTERACTIVAS (Semana 1, 2, 3, 4, 5) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  Semanas del Mes & Cómputo Salarial
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Selecciona la semana para ver la nómina y auditar los días trabajados con faltas o retrasos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activePeriod && (
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 border ${
                      activePeriod.status === 'OPEN'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {activePeriod.status === 'OPEN' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {activePeriod.name} en curso ({deadlineInfo.text})
                      </>
                    ) : (
                      <>
                        <span>🔒</span> {activePeriod.name} (Cerrada)
                      </>
                    )}
                  </span>
                )}

                {isBossOrAdmin && (
                  <button
                    onClick={() => onOpenAddPeriod('SEMANAL')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="Crear otra semana de pago personalizada"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Otra Semana</span>
                  </button>
                )}
              </div>
            </div>

            {/* Barritas de Semanas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {weeklyPeriods.map((p, idx) => {
                const isSelected = p.id === activePeriod?.id;
                const todayStr = new Date().toISOString().split('T')[0];
                const isCurrent = p.id === 'per-sem-2-sept-2026' || (p.status === 'OPEN' && todayStr >= p.startDate && todayStr <= p.endDate);

                const pRecords = payrollRecords.filter((r) => r.periodId === p.id);
                const weekNetSum = pRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
                const paidCount = pRecords.filter((r) => r.status === 'PAID').length;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPeriodId(p.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500 shadow-md ring-2 ring-sky-500/40'
                        : isCurrent
                        ? 'bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-black ${
                          isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        Semana {p.periodNumber || idx + 1}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          Semana en Curso
                        </span>
                      ) : p.status === 'CLOSED' ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-bold">
                          Cerrada (Pagada)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[8px] font-bold">
                          Por Iniciar
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block font-bold">
                        {p.startDate.slice(5).replace('-', '/')} – {p.endDate.slice(5).replace('-', '/')}
                      </span>
                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                        <span className="font-mono font-black text-slate-700 dark:text-slate-300">
                          {currencySymbol} {weekNetSum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span
                          className={`font-semibold ${
                            paidCount === pRecords.length && pRecords.length > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {paidCount}/{pRecords.length} pagados
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

      {/* 🚨 ALERTA DE DEUDAS PENDIENTES / PAGOS ATRASADOS DE SEMANAS ANTERIORES */}
      {pastUnpaidWeeklyRecords.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-500/10 border-2 border-red-500/30 text-red-950 dark:text-red-200 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-tight">
                  Alerta de Control: {pastUnpaidWeeklyRecords.length} Pago(s) Semanal(es) Atrasado(s) de Semanas Anteriores
                </h3>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  Ya inició una nueva semana y estos trabajadores aún no tienen su pago registrado. Liquídalos para mantener las cuentas al día.
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                Total Deuda Acumulada:
              </span>
              <span className="text-xl font-black font-mono text-red-600 dark:text-red-400">
                {currencySymbol} {totalPastUnpaidDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Lista de deudas atrasadas con botón de pago directo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {pastUnpaidWeeklyRecords.map((debtRec) => {
              const debtPeriod = periods.find((p) => p.id === debtRec.periodId);
              return (
                <div
                  key={debtRec.id}
                  className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-red-500/30 flex items-center justify-between gap-2 text-xs shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">
                      {debtRec.employee.lastName}, {debtRec.employee.firstName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {debtPeriod?.name || 'Semana Anterior'} &bull; DNI: {debtRec.employee.dni}
                    </p>
                    <span className="font-mono font-black text-red-600 dark:text-red-400">
                      Adeuda: {currencySymbol} {Number(debtRec.netAmount).toFixed(2)}
                    </span>
                  </div>

                  {onOpenPaymentQR && (
                    <button
                      onClick={() => onOpenPaymentQR(debtRec, debtPeriod || activePeriod)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[11px] flex items-center gap-1 shadow-sm transition-all shrink-0 cursor-pointer"
                      title="Registrar pago y liquidar deuda atrasada"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Pagar Deuda
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-sky-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
            Salario Base Semanal
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {currencySymbol} {totalBase.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Suma de los sueldos semanales
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Horas Extras & Recargos
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            +{currencySymbol} {totalOvertime.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Horas extras al 150%
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-red-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider block">
            Adelantos Deducidos
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono mt-1">
            -{currencySymbol} {totalAdvances.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Descuento de anticipos en la semana
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-indigo-600 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-indigo-500/5 to-transparent">
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Desembolso Líquido Total
          </span>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1">
            {currencySymbol} {totalNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {paidRecordsCount} de {activeRecords.length} trabajadores pagados
          </p>
        </div>
      </div>

      {/* Tabla de Nómina Semanal con botón WhatsApp */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        {activeRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
              No hay trabajadores con Pago Semanal registrados todavía
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Ve a <strong>"Trabajadores / Sueldos"</strong> y registra al personal de Logística, Choferes o Almacén con modalidad <strong>Pago Semanal</strong>. En cuanto los guardes, aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Trabajador</th>
                  <th className="px-4 py-3.5">Cargo / Jornada</th>
                  <th className="px-4 py-3.5 text-center">Días Trab.</th>
                  <th className="px-4 py-3.5 text-right">Sueldo Base</th>
                  <th className="px-4 py-3.5 text-right">H. Extras</th>
                  <th className="px-4 py-3.5 text-right">Adelantos</th>
                  <th className="px-4 py-3.5 text-right font-black text-slate-900 dark:text-white">
                    Líquido a Pagar
                  </th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-center">Acciones & WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {activeRecords.map((rec) => {
                  const isPaid = rec.status === 'PAID';
                  const isLunASab = rec.employee.workSchedule === 'LUNES_A_SABADO' || !rec.employee.workSchedule;
                  const standardDays = isLunASab ? 6 : 5;

                  // Verificar si este trabajador arrastra deuda de semanas anteriores
                  const workerPastDebts = pastUnpaidWeeklyRecords.filter(
                    (p) => (p.employee?.dni || p.employeeId) === (rec.employee?.dni || rec.employeeId)
                  );
                  const workerPastDebtTotal = workerPastDebts.reduce((sum, d) => sum + Number(d.netAmount), 0);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {rec.employee.lastName}, {rec.employee.firstName}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            DNI: {rec.employee.dni}
                          </span>
                          {workerPastDebts.length > 0 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1 shadow-xs">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Arrastra deuda: {currencySymbol} {workerPastDebtTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{rec.employee.position}</div>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                          {isLunASab ? 'Lun a Sáb (6 días)' : 'Lun a Vie (5 días)'}
                        </span>
                      </td>

                      {/* DÍAS TRABAJADOS (Control Rápido de Faltas) */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <button
                              type="button"
                              disabled={rec.workedDays <= 0 || isPaid}
                              onClick={() => {
                                const next = Math.max(0, rec.workedDays - 1);
                                updateRecord(rec.id, { workedDays: next });
                              }}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center font-black text-xs transition-colors disabled:opacity-25 cursor-pointer"
                              title="Restar 1 día trabajado (Registrar inasistencia / falta)"
                            >
                              -
                            </button>

                            <span className="font-mono font-black text-xs px-2 text-slate-900 dark:text-white min-w-12 text-center">
                              {rec.workedDays} {rec.workedDays === 1 ? 'día' : 'días'}
                            </span>

                            <button
                              type="button"
                              disabled={rec.workedDays >= standardDays || isPaid}
                              onClick={() => {
                                const next = Math.min(standardDays, rec.workedDays + 1);
                                updateRecord(rec.id, { workedDays: next });
                              }}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center font-black text-xs transition-colors disabled:opacity-25 cursor-pointer"
                              title="Sumar 1 día trabajado"
                            >
                              +
                            </button>
                          </div>

                          {rec.workedDays === standardDays ? (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Completo ({standardDays}/{standardDays}d)
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/25">
                              ⚠️ {standardDays - rec.workedDays} falta(s) esta sem.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SUELDO BASE / PROPORCIONAL */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                            {currencySymbol} {Number(rec.baseSalary).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Diario: {currencySymbol} {(Number(rec.baseSalary) / standardDays).toFixed(2)}
                          </span>
                          {rec.workedDays < standardDays && (
                            <span className="text-[9px] font-black text-red-600 dark:text-red-400 block bg-red-500/10 px-1 py-0.2 rounded border border-red-500/20">
                              -{currencySymbol} {((Number(rec.baseSalary) / standardDays) * (standardDays - rec.workedDays)).toFixed(2)} (descuento)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        {rec.overtimeAmount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            +{currencySymbol} {Number(rec.overtimeAmount).toFixed(2)} ({rec.overtimeHours}h)
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        {rec.advancesDeduction > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">
                            -{currencySymbol} {Number(rec.advancesDeduction).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {currencySymbol} {Number(rec.netAmount).toFixed(2)}
                      </td>

                      {/* ESTADO */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {isPaid ? 'PAGADO' : 'PENDIENTE'}
                          </span>

                          {isPaid ? (
                            <div className="flex flex-col items-center text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                📅 {rec.paymentDate || 'Registrado'}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                {rec.paymentMethod === 'QR_BANCARIO'
                                  ? 'QR Bancario'
                                  : rec.paymentMethod === 'TRANSFERENCIA'
                                  ? 'Transferencia'
                                  : 'Efectivo'}
                                {rec.paymentReference ? ` (${rec.paymentReference})` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-[10px] ${deadlineInfo.color}`}>
                              {deadlineInfo.text}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Registrar Pago Individual */}
                          {onOpenPaymentQR && !isPaid && (
                            <button
                              onClick={() => onOpenPaymentQR(rec, activePeriod)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              title="Registrar pago realizado al trabajador"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Registrar Pago
                            </button>
                          )}

                          {/* Reversar pago si fue registrado por error */}
                          {isPaid && isBossOrAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Deseas anular la confirmación de pago de ${rec.employee.firstName} ${rec.employee.lastName}? El registro volverá a estado PENDIENTE.`
                                  )
                                ) {
                                  markRecordAsUnpaid(rec.id);
                                }
                              }}
                              className="p-1.5 px-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 text-[10px] font-bold transition-all"
                              title="Reversar / Desmarcar pagado si hubo error"
                            >
                              Reversar
                            </button>
                          )}

                          {/* 📲 Enviar boleta por WhatsApp */}
                          <button
                            onClick={() => sendPayslipViaWhatsApp(rec, activePeriod, currencySymbol)}
                            className="p-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title={`Enviar boleta por WhatsApp al ${rec.employee.phone || 'celular'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Ajuste de días / Horas extras */}
                          <button
                            onClick={() => onSelectRecordForDrawer(rec, activePeriod)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Ajustar días u horas extras y ver desglose"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {/* Boleta PDF */}
                          <button
                            onClick={() => onOpenPayslip(rec, activePeriod)}
                            className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
                            title="Ver / Descargar Boleta PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      )}
    </div>
  );
};
