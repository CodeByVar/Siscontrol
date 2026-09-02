import React, { useState } from 'react';
import {
  HandCoins,
  Search,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdvancesViewProps {
  openAddAdvanceModal: () => void;
}

export const AdvancesView: React.FC<AdvancesViewProps> = ({ openAddAdvanceModal }) => {
  const { advances, deleteAdvance, currentRole, currencySymbol } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  const filteredAdvances = advances.filter((adv) => {
    const matchesStatus = statusFilter === 'ALL' || adv.status === statusFilter;
    const matchesSearch =
      (adv.employeeName && adv.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (adv.employeeDni && adv.employeeDni.includes(searchTerm)) ||
      adv.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalPending = advances
    .filter((a) => a.status === 'PENDING')
    .reduce((acc, a) => acc + Number(a.amount), 0);

  const totalDeducted = advances
    .filter((a) => a.status === 'DEDUCTED')
    .reduce((acc, a) => acc + Number(a.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Control de Adelantos y Anticipos Salariales
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Los anticipos en estado <strong>"Pendiente"</strong> se descuentan automáticamente en la nómina.
              </p>
            </div>
          </div>
        </div>

        {isBossOrAdmin && (
          <button
            onClick={openAddAdvanceModal}
            className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Adelanto
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Adelantos Pendientes
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {currencySymbol} {totalPending.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Se restarán en la próxima liquidación</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Adelantos Deducidos
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {currencySymbol} {totalDeducted.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">Ya liquidados en recibos previos</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Solicitudes
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {advances.length}
          </p>
          <span className="text-[11px] text-slate-400">Historial completo</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por empleado o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">Pendientes de Descuento</option>
            <option value="DEDUCTED">Ya Deducidos / Pagados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Adelantos */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
        {filteredAdvances.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se encontraron registros de adelantos con los filtros actuales.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="px-4 py-3.5">Trabajador</th>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Motivo / Justificación</th>
                  <th className="px-4 py-3.5 text-right">Monto Adelantado</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredAdvances.map((adv) => {
                  const isPending = adv.status === 'PENDING';

                  return (
                    <tr key={adv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {adv.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          DNI: {adv.employeeDni}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{adv.requestDate}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {adv.reason}
                        </span>
                        {adv.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">{adv.notes}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-amber-600 dark:text-amber-400 text-sm font-mono">
                        {currencySymbol} {Number(adv.amount).toFixed(2)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {isPending ? 'PENDIENTE DE CORTE' : 'DESCONTADO EN NÓMINA'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isBossOrAdmin && isPending && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la solicitud de adelanto de ${adv.employeeName}?`)) {
                                deleteAdvance(adv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Eliminar Adelanto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
