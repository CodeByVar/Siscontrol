import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentFrequency } from '../types';

interface AddPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrequency?: PaymentFrequency;
}

export const AddPeriodModal: React.FC<AddPeriodModalProps> = ({
  isOpen,
  onClose,
  defaultFrequency = 'SEMANAL',
}) => {
  const { addPeriod } = useApp();

  const [frequency, setFrequency] = useState<PaymentFrequency>(defaultFrequency);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodNumber, setPeriodNumber] = useState('36');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      alert('Por favor completa todos los campos del periodo.');
      return;
    }

    const generatedCode =
      code ||
      (frequency === 'SEMANAL'
        ? `SEM-2026-W${periodNumber}`
        : `MES-2026-${periodNumber.padStart(2, '0')}`);

    addPeriod({
      code: generatedCode,
      name,
      frequency,
      startDate,
      endDate,
      year: 2026,
      periodNumber: Number(periodNumber) || 1,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Abrir Nuevo Periodo de Pago
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Definir corte de fecha para liquidar salarios
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
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
              Frecuencia de Pago *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
            >
              <option value="SEMANAL" className="bg-white dark:bg-slate-900">
                SEMANAL (Personal de Logística/Operativo)
              </option>
              <option value="MENSUAL" className="bg-white dark:bg-slate-900">
                MENSUAL (Oficina / Ventas)
              </option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
              Nombre Descriptivo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              placeholder="Ej. Semana 36 (01 Sep - 07 Sep 2026)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Fecha Inicio *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
                Fecha Fin (Corte) *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-400 font-medium mb-1.5 block">
              Nº de Semana / Mes
            </label>
            <input
              type="number"
              value={periodNumber}
              onChange={(e) => setPeriodNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
              placeholder="Ej. 36 para semana o 9 para septiembre"
            />
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
              Crear Periodo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
