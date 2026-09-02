import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  CheckCircle2,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { PayrollRecord, PayrollPeriod } from '../types';
import { useApp } from '../context/AppContext';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { sendPayslipViaWhatsApp } from '../lib/whatsappGenerator';

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  period: PayrollPeriod | null;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  onClose,
  record,
  period,
}) => {
  const { updateRecord, currentRole, currencySymbol } = useApp();

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  const [workedDays, setWorkedDays] = useState(6);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [bonusesAmount, setBonusesAmount] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  const isWeekly = record?.employee.paymentFrequency === 'SEMANAL';
  const isLunASab = record?.employee.workSchedule === 'LUNES_A_SABADO' || (!record?.employee.workSchedule && isWeekly);

  // Días laborables reales según jornada
  const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);

  useEffect(() => {
    if (record) {
      setWorkedDays(record.workedDays <= standardDays ? record.workedDays : standardDays);
      setOvertimeHours(record.overtimeHours);
      setBonusesAmount(record.bonusesAmount);
      setOtherDeductions(record.otherDeductions);
    }
  }, [record, standardDays]);

  if (!isOpen || !record || !period) return null;

  // Cálculo en vivo por días efectivamente trabajados
  const dailyRate = record.baseSalary / standardDays;
  const earnedBase = Number((dailyRate * workedDays).toFixed(2));
  const regularHours = isWeekly ? (isLunASab ? 48 : 40) : (isLunASab ? 192 : 160);
  const hourlyRate = record.baseSalary / regularHours;
  const overtimeAmount = Number((overtimeHours * hourlyRate * 1.5).toFixed(2));
  const totalEarnings = Number((earnedBase + overtimeAmount + Number(bonusesAmount)).toFixed(2));
  const totalDeductions = Number((record.advancesDeduction + Number(otherDeductions)).toFixed(2));
  const netAmount = Number(Math.max(0, totalEarnings - totalDeductions).toFixed(2));

  const handleSave = () => {
    updateRecord(record.id, {
      workedDays,
      overtimeHours,
      bonusesAmount: Number(bonusesAmount),
      otherDeductions: Number(otherDeductions),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-y-auto animate-slide-in-right z-10">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-sky-500/20 border border-sky-300/30">
              {record.employee.firstName.charAt(0)}
              {record.employee.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {record.employee.lastName}, {record.employee.firstName}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isWeekly
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                >
                  {record.employee.paymentFrequency}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span>{record.employee.position}</span> &bull;
                <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" />
                  {isLunASab ? 'Lun a Sáb (6d)' : 'Lun a Vie (5d)'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Card Resumen de Período y Estado */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Periodo Liquidado
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{period.name}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Estado del Recibo
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block mt-0.5 ${record.status === 'PAID'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
              >
                {record.status === 'PAID' ? 'PAGADO' : 'BORRADOR'}
              </span>
            </div>
          </div>

          {/* Simulador Interactivo de Salario */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                Simulador por Días Trabajados Reales
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Valor Día: <strong className="text-slate-900 dark:text-white font-mono">{currencySymbol} {dailyRate.toFixed(2)}</strong>
              </span>
            </div>

            {/* Días Trabajados Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Días Trabajados ({workedDays} / {standardDays} días pactados)
                </label>
                <span className="font-mono font-black text-sky-600 dark:text-sky-400 text-sm">
                  {currencySymbol} {earnedBase.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={standardDays}
                value={workedDays}
                disabled={!isBossOrAdmin || period.status === 'CLOSED'}
                onChange={(e) => setWorkedDays(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0 días</span>
                <span>Cálculo: {currencySymbol} {dailyRate.toFixed(2)} x {workedDays} días</span>
                <span>{standardDays} días</span>
              </div>
            </div>

            {/* Horas Extras Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Horas Extras al 150% ({overtimeHours} hrs)
                </label>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                  +{currencySymbol} {overtimeAmount.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={overtimeHours}
                disabled={!isBossOrAdmin || period.status === 'CLOSED'}
                onChange={(e) => setOvertimeHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0 hrs</span>
                <span>Valor hora extra: {currencySymbol} {(hourlyRate * 1.5).toFixed(2)}</span>
                <span>24 hrs máx</span>
              </div>
            </div>

            {/* Bonos y Deducciones */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Bonos / Extras ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bonusesAmount}
                  disabled={!isBossOrAdmin || period.status === 'CLOSED'}
                  onChange={(e) => setBonusesAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Otras Deducciones ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={otherDeductions}
                  disabled={!isBossOrAdmin || period.status === 'CLOSED'}
                  onChange={(e) => setOtherDeductions(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Adelantos Deducidos Banner */}
            {record.advancesDeduction > 0 && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/30 flex items-center justify-between">
                <span className="text-red-700 dark:text-red-400 font-bold">
                  Adelantos Deducidos Automáticamente:
                </span>
                <span className="font-mono font-black text-red-700 dark:text-red-400">
                  -{currencySymbol} {record.advancesDeduction.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Líquido Pagable Final Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-50 via-white to-emerald-100 dark:from-emerald-950/60 dark:via-slate-950 dark:to-emerald-900/30 border border-emerald-300 dark:border-emerald-500/40 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-black text-emerald-800 dark:text-emerald-400 tracking-wider">
                Líquido Pagable Final (Neto)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {record.paymentMethod === 'QR_BANCARIO' ? 'QR Bancario' : record.employee.bankName || 'Pago Efectivo'}
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-800 dark:text-emerald-300 font-mono tracking-tight">
              {currencySymbol} {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-emerald-200 dark:border-emerald-500/20 font-mono">
              <span>Total Ingresos: {currencySymbol} {totalEarnings.toFixed(2)}</span>
              <span>Total Descuentos: -{currencySymbol} {totalDeductions.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 sticky bottom-0 z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* WhatsApp */}
            <button
              onClick={() => sendPayslipViaWhatsApp(record, period, currencySymbol)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Enviar boleta por WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* Boleta PDF */}
            <button
              onClick={() => generatePayslipPDF(record, period)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-500" />
              <span>PDF</span>
            </button>
          </div>

          {isBossOrAdmin && period.status !== 'CLOSED' && (
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-brand-500 hover:from-sky-500 hover:to-brand-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar y Actualizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
