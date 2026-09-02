import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Users,
  CreditCard,
  QrCode,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
  onViewQR?: (emp: Employee) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployee,
  onViewQR,
}) => {
  const { employees, currencySymbol } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      emp.firstName.toLowerCase().includes(query) ||
      emp.lastName.toLowerCase().includes(query) ||
      emp.dni.includes(query) ||
      emp.position.toLowerCase().includes(query) ||
      emp.department.toLowerCase().includes(query) ||
      emp.paymentFrequency.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar trabajador por nombre, C.I./DNI, cargo o área..."
            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {employees.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Aún no tienes trabajadores registrados.
              </p>
              <p className="text-[11px] text-slate-400">
                Usa el botón "+ Nuevo Trabajador" para registrar a tu personal.
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No se encontraron coincidencias para "{searchQuery}".
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isWeekly = emp.paymentFrequency === 'SEMANAL';

              return (
                <div
                  key={emp.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0">
                      {emp.firstName.charAt(0)}
                      {emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {emp.lastName}, {emp.firstName}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            isWeekly
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {emp.paymentFrequency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {emp.position} &bull; DNI: <strong className="font-mono">{emp.dni}</strong> &bull; {emp.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        Salario Base
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                        {currencySymbol} {Number(emp.baseSalary).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {emp.qrImageUrl && onViewQR && (
                        <button
                          onClick={() => {
                            onViewQR(emp);
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                          title="Ver QR de Cobro"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}

                      {onSelectEmployee && (
                        <button
                          onClick={() => {
                            onSelectEmployee(emp);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span>Ficha</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>{filteredEmployees.length} resultado(s) encontrado(s)</span>
          <span>Presiona <strong>ESC</strong> para salir</span>
        </div>
      </div>
    </div>
  );
};
