import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Phone,
  CreditCard,
  QrCode,
  Edit,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';

interface EmployeesViewProps {
  openAddEmployeeModal: () => void;
  onEditEmployee?: (emp: Employee) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  openAddEmployeeModal,
  onEditEmployee,
}) => {
  const { employees, deleteEmployee, currentRole, currencySymbol, formatMoney } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [previewingQR, setPreviewingQR] = useState<{ name: string; qrUrl: string } | null>(null);

  const isBossOrAdmin = currentRole === 'SUPERADMIN' || currentRole === 'ADMINISTRADOR';

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.dni.includes(searchTerm) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFreq = frequencyFilter === 'ALL' || emp.paymentFrequency === frequencyFilter;
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

    return matchesSearch && matchesFreq && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Fichas de Trabajadores y Salarios
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Padrón de personal con modalidad (Semanal / Mensual), cálculo exacto por día trabajado y códigos QR.
              </p>
            </div>
          </div>
        </div>

        {isBossOrAdmin && (
          <button
            onClick={openAddEmployeeModal}
            className="px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Trabajador
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 px-2.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 font-bold">Cobro:</span>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">Todos</option>
              <option value="SEMANAL" className="bg-white dark:bg-slate-900">Semanal (Operativo)</option>
              <option value="MENSUAL" className="bg-white dark:bg-slate-900">Mensual (Oficina/Ventas)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 px-2.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 font-bold">Área:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900">Todas las áreas</option>
              <option value="LOGISTICA" className="bg-white dark:bg-slate-900">LOGÍSTICA</option>
              <option value="VENTAS" className="bg-white dark:bg-slate-900">VENTAS</option>
              <option value="OFICINA" className="bg-white dark:bg-slate-900">OFICINA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Fichas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isWeekly = emp.paymentFrequency === 'SEMANAL';
          const isLunASab = emp.workSchedule === 'LUNES_A_SABADO' || (!emp.workSchedule && isWeekly);

          const workingDaysInPeriod = isWeekly
            ? isLunASab
              ? 6
              : 5
            : isLunASab
            ? 24
            : 20;

          const dailyRate = Number(emp.baseSalary) / workingDaysInPeriod;

          return (
            <div
              key={emp.id}
              className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      isWeekly
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    COBRO {emp.paymentFrequency}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {emp.qrImageUrl && (
                      <button
                        onClick={() =>
                          setPreviewingQR({
                            name: `${emp.firstName} ${emp.lastName}`,
                            qrUrl: emp.qrImageUrl!,
                          })
                        }
                        className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver QR Bancario en Grande"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Ver QR
                      </button>
                    )}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {emp.department}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                    {emp.firstName.charAt(0)}
                    {emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {emp.lastName}, {emp.firstName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {emp.position}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-mono">DNI: {emp.dni}</p>

                {/* Badge de Jornada Laboral */}
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                  <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>Jornada: {isLunASab ? 'Lunes a Sábado (6 días)' : 'Lunes a Viernes (5 días)'}</span>
                </div>

                {/* Salario Base Card con cálculo por días trabajados reales */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Salario Base {isWeekly ? '(Semanal)' : '(Mensual)'}
                    </span>
                    <span className="text-base font-black text-brand-600 dark:text-brand-400 font-mono">
                      {formatMoney(emp.baseSalary)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Por Día Trabajado
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono block">
                      {formatMoney(dailyRate)}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-medium">
                      ({workingDaysInPeriod} días {isWeekly ? '/sem' : '/mes'})
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.bankName && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        {emp.bankName} {emp.bankAccountNumber && `(${emp.bankAccountNumber})`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isBossOrAdmin && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Activo
                  </span>

                  <div className="flex items-center gap-1.5">
                    {onEditEmployee && (
                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar Salario, Jornada o Modalidad"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar al trabajador ${emp.firstName} ${emp.lastName}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar Empleado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Previsualización QR EXTRA GRANDE */}
      {previewingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                QR Bancario de {previewingQR.name}
              </h2>
              <button
                onClick={() => setPreviewingQR(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-3xl border-2 border-slate-300 shadow-md inline-flex items-center justify-center mx-auto">
              <img
                src={previewingQR.qrUrl}
                alt="QR Code"
                className="w-72 sm:w-80 max-h-80 object-contain rounded-2xl"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Abre tu banca móvil y escanea directamente desde la pantalla.
            </p>

            <button
              onClick={() => setPreviewingQR(null)}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
