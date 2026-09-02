import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  DollarSign,
  QrCode,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  Plus,
  Clock,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PayrollRecord, PayrollPeriod } from '../types';
import { sendPayslipViaWhatsApp } from '../lib/whatsappGenerator';

interface MonthlyPayrollViewProps {
  onSelectRecordForDrawer: (record: PayrollRecord, period: PayrollPeriod) => void;
  onOpenPayslip: (record: PayrollRecord, period: PayrollPeriod) => void;
  onOpenAddPeriod: (frequency: 'SEMANAL' | 'MENSUAL') => void;
  onOpenPaymentQR?: (record: PayrollRecord, period: PayrollPeriod) => void;
}

const getMonthlyDeadlineInfo = () => {
  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diffTime = lastDayOfMonth.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return { text: `Faltan ${diffDays} días`, color: 'text-slate-500 dark:text-slate-400 font-medium' };
  } else if (diffDays === 1) {
    return { text: 'Vence mañana', color: 'text-amber-600 dark:text-amber-400 font-bold' };
  } else if (diffDays === 0) {
    return { text: 'Hoy es día de pago', color: 'text-emerald-600 dark:text-emerald-400 font-bold' };
  } else {
    const day = now.getDate();
    if (day <= 2) {
      return { text: 'Plazo máx. (Día 2)', color: 'text-amber-600 dark:text-amber-400 font-bold' };
    }
    return { text: 'Plazo Vencido', color: 'text-red-500 font-bold' };
  }
};

export const MonthlyPayrollView: React.FC<MonthlyPayrollViewProps> = ({
  onSelectRecordForDrawer,
  onOpenPayslip,
  onOpenAddPeriod,
  onOpenPaymentQR,
}) => {
  const { periods, payrollRecords, approveAndClosePeriod, currentRole, currencySymbol } = useApp();

  const monthlyPeriods = periods.filter((p) => p.frequency === 'MENSUAL');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  useEffect(() => {
    if (monthlyPeriods.length > 0 && !selectedPeriodId) {
      const openPeriod = monthlyPeriods.find((p) => p.status === 'OPEN');
      setSelectedPeriodId(openPeriod ? openPeriod.id : monthlyPeriods[0].id);
    }
  }, [monthlyPeriods, selectedPeriodId]);

  const activePeriod = monthlyPeriods.find((p) => p.id === selectedPeriodId) || monthlyPeriods[0];
  const rawRecords = payrollRecords.filter((r) => r.periodId === (activePeriod?.id || ''));
  // Deduplicación estricta por Carnet de Identidad (DNI) para evitar filas dobles
  const activeRecords = rawRecords.filter((rec, index, self) => {
    const key = rec.employee?.dni || rec.employeeId;
    return index === self.findIndex((r) => (r.employee?.dni || r.employeeId) === key);
  });

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  const totalBase = activeRecords.reduce((acc, r) => acc + Number(r.baseSalary), 0);
  const totalAdvances = activeRecords.reduce((acc, r) => acc + Number(r.advancesDeduction), 0);
  const totalCommissions = activeRecords.reduce((acc, r) => acc + Number(r.bonusesAmount), 0);
  const totalNet = activeRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const paidRecordsCount = activeRecords.filter((r) => r.status === 'PAID').length;
  const pendingRecordsCount = activeRecords.filter((r) => r.status !== 'PAID').length;

  const deadlineInfo = getMonthlyDeadlineInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nómina Mensual (Oficina, Ventas y Compras)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liquidación mensual automática, pagos por QR y envío de boletas por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {monthlyPeriods.length > 1 && (
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white shadow-sm focus:outline-none"
            >
              {monthlyPeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'OPEN' ? '(Abierto)' : '(Cerrado)'}
                </option>
              ))}
            </select>
          )}

          {isBossOrAdmin && (
            <button
              onClick={() => onOpenAddPeriod('MENSUAL')}
              className="px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
              title="Abrir otro periodo de mes si lo necesitas"
            >
              <Plus className="w-3.5 h-3.5" />
              Otro Mes
            </button>
          )}
        </div>
      </div>

      {/* Regla y Notificación de Plazo de Pago Mensual */}
      <div className="p-3.5 px-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Plazo Límite de Pago Mensual:</strong> Último día del mes (máximo día 2). &bull;{' '}
            <strong className={deadlineInfo.color}>{deadlineInfo.text}</strong>
          </span>
        </div>
        {pendingRecordsCount > 0 ? (
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
            {pendingRecordsCount} pago(s) pendiente(s)
          </span>
        ) : (
          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
            Completado
          </span>
        )}
      </div>

      {/* Banner de Estado Automático */}
      {activePeriod && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent border border-emerald-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {activePeriod.name}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {activePeriod.status === 'OPEN' ? 'PERIODO ACTIVO (EN CURSO)' : 'LIQUIDACIÓN CERRADA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tus trabajadores mensuales ya están cargados automáticamente listos para transferir o imprimir boletas.
              </p>
            </div>
          </div>

          {isBossOrAdmin && activePeriod.status === 'OPEN' && (
            <button
              onClick={() => {
                if (confirm('¿Deseas cerrar este mes y archivar todas las boletas pagadas?')) {
                  approveAndClosePeriod(activePeriod.id);
                }
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cerrar Mes & Pasar al Siguiente
            </button>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Presupuesto Base del Mes
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {currencySymbol} {totalBase.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Suma de sueldos base pactados
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Comisiones & Bonos
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            +{currencySymbol} {totalCommissions.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ventas mayoristas e incentivos
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
            Vales descontados del mes
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-indigo-600 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-indigo-500/5 to-transparent">
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Líquido Total a Desembolsar
          </span>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1">
            {currencySymbol} {totalNet.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {paidRecordsCount} de {activeRecords.length} trabajadores pagados
          </p>
        </div>
      </div>

      {/* Tabla de Nómina Mensual con botón WhatsApp */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        {activeRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
              No hay trabajadores con Pago Mensual registrados todavía
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Ve a <strong>"Trabajadores / Sueldos"</strong> y registra al personal de Oficina, Ventas o Compras. En cuanto los guardes, aparecerán aquí automáticamente listos para cobrar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Trabajador</th>
                  <th className="px-4 py-3.5">Cargo / Jornada</th>
                  <th className="px-4 py-3.5 text-right">Sueldo Base</th>
                  <th className="px-4 py-3.5 text-right">Comisión / Bono</th>
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
                  const isLunASab = rec.employee.workSchedule === 'LUNES_A_SABADO';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {rec.employee.lastName}, {rec.employee.firstName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          DNI: {rec.employee.dni}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="font-medium">{rec.employee.position}</div>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                          {isLunASab ? 'Lun a Sáb (24 días)' : 'Lun a Vie (20 días)'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {currencySymbol} {Number(rec.baseSalary).toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        {rec.bonusesAmount > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            +{currencySymbol} {Number(rec.bonusesAmount).toFixed(2)}
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

                          <span className={`text-[10px] ${isPaid ? 'text-slate-400 dark:text-slate-500 font-medium' : deadlineInfo.color}`}>
                            {isPaid
                              ? (rec.paymentMethod === 'QR_BANCARIO' ? 'Vía QR' : 'Efectivo')
                              : deadlineInfo.text}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Pagar QR */}
                          {onOpenPaymentQR && !isPaid && (
                            <button
                              onClick={() => onOpenPaymentQR(rec, activePeriod)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              title="Escanear QR y Pagar Salario"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              Pagar QR
                            </button>
                          )}

                          {/* 📲 NUEVO BOTÓN: ENVIAR BOLETA POR WHATSAPP */}
                          <button
                            onClick={() => sendPayslipViaWhatsApp(rec, activePeriod, currencySymbol)}
                            className="p-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title={`Enviar boleta por WhatsApp al ${rec.employee.phone || 'celular'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Ajuste de días o bonos */}
                          <button
                            onClick={() => onSelectRecordForDrawer(rec, activePeriod)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Ajustar días o bonos"
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
  );
};
