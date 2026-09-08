import React, { useState } from 'react';
import { X, Edit, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PayrollRecord } from '../types';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { updateRecord, currencySymbol } = useApp();

  if (!isOpen || !record) return null;

  const isWeekly = record.employee.paymentFrequency === 'SEMANAL';
  const isLunASab = record.employee.workSchedule === 'LUNES_A_SABADO' || (!record.employee.workSchedule && isWeekly);
  const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);

  const [workedDays, setWorkedDays] = useState(record.workedDays);
  const [overtimeHours, setOvertimeHours] = useState(record.overtimeHours);
  const [bonusesAmount, setBonusesAmount] = useState(record.bonusesAmount);
  const [otherDeductions, setOtherDeductions] = useState(record.otherDeductions);

  // Cálculo en vivo
  const dailyRate = record.baseSalary / standardDays;
  const earnedBase = dailyRate * workedDays;
  const regularHours = isWeekly ? (isLunASab ? 48 : 40) : (isLunASab ? 192 : 160);
  const hourlyRate = record.baseSalary / regularHours;
  const overtimeAmount = overtimeHours * hourlyRate * 1.5;
  const totalEarnings = earnedBase + overtimeAmount + Number(bonusesAmount);
  const totalDeductions = record.advancesDeduction + Number(otherDeductions);
  const netAmount = Math.max(0, totalEarnings - totalDeductions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateRecord(record.id, {
      workedDays: Number(workedDays),
      overtimeHours: Number(overtimeHours),
      bonusesAmount: Number(bonusesAmount),
      otherDeductions: Number(otherDeductions),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Ajustar Conceptos de Nómina
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {record.employee.lastName}, {record.employee.firstName} ({record.employee.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tarjeta de Datos Base */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Salario Base Pactado
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {currencySymbol} {record.baseSalary.toLocaleString()} / {isWeekly ? 'Semana' : 'Mes'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Adelantos Deducidos
              </span>
              <span className="text-sm font-black text-red-600 dark:text-red-400 font-mono">
                -{currencySymbol} {record.advancesDeduction.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Días Trabajados (Máx {standardDays})
              </label>
              <input
                type="number"
                min="0"
                max={standardDays}
                value={workedDays}
                onChange={(e) => setWorkedDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Horas Extras (150%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-sm"
              />
              {overtimeAmount > 0 && (
                <span className="text-[10px] text-sky-600 dark:text-sky-400 block mt-1 font-mono font-semibold">
                  =+{currencySymbol} {overtimeAmount.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Bonos / Comisiones ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bonusesAmount}
                onChange={(e) => setBonusesAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Otras Deducciones ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono font-bold text-sm"
              />
            </div>
          </div>

          {/* Previsualización del Neto Calculado */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-400 block">
                  Nuevo Neto a Cobrar (Calculado)
                </span>
                <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                  {currencySymbol} {netAmount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <p>Haberes: {currencySymbol} {totalEarnings.toFixed(2)}</p>
              <p>Deducciones: -{currencySymbol} {totalDeductions.toFixed(2)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all"
            >
              Aplicar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
