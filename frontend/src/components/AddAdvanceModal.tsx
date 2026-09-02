import React, { useState } from 'react';
import { X, HandCoins } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAdvanceModal: React.FC<AddAdvanceModalProps> = ({ isOpen, onClose }) => {
  const { employees, addAdvance, currencySymbol } = useApp();

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');

  const [employeeId, setEmployeeId] = useState(activeEmployees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedEmployee = activeEmployees.find((e) => e.id === employeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || !reason) {
      alert('Por favor selecciona al trabajador, monto y motivo.');
      return;
    }

    addAdvance({
      employeeId,
      amount: Number(amount),
      reason,
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Registrar Adelanto de Sueldo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se descontará automáticamente en la próxima nómina
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
          {/* Trabajador Selector */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
              Seleccionar Trabajador *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {activeEmployees.map((emp) => (
                <option
                  key={emp.id}
                  value={emp.id}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {emp.lastName}, {emp.firstName} &mdash; [{emp.paymentFrequency}] {currencySymbol}{' '}
                  {emp.baseSalary}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Frecuencia: <strong className="text-slate-900 dark:text-white">{selectedEmployee.paymentFrequency}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Salario Base: <strong className="text-sky-600 dark:text-sky-400">{currencySymbol} {selectedEmployee.baseSalary}</strong>
              </span>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
              Monto a Adelantar *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                placeholder="Ej. 150.00"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1.5 block">
              Motivo / Justificación *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="Ej. Urgencia médica, anticipo de pasajes, arriendo..."
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-slate-600 dark:text-slate-400 font-medium mb-1.5 block">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
              placeholder="Anotaciones para el jefe o administración..."
            />
          </div>

          {/* Buttons Footer */}
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 transition-all"
            >
              Registrar Adelanto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
