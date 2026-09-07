import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Layers,
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  QrCode,
  CreditCard,
  Building2,
  Printer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PayrollRecord, Employee } from '../types';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { exportPayrollToExcel } from '../lib/excelExport';

export const ReportsView: React.FC = () => {
  const { payrollRecords, periods, employees, currencySymbol } = useApp();
  const [activeReportTab, setActiveReportTab] = useState<'MONTHLY' | 'INDIVIDUAL'>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    employees[0]?.id || ''
  );

  // 1. Datos para Reporte Mensual Consolidado (Separación exacta entre Pagado Efectivo y Deuda Pendiente)
  const paidRecords = payrollRecords.filter((r) => r.status === 'PAID');
  const pendingRecords = payrollRecords.filter((r) => r.status !== 'PAID');

  const totalPaidDisbursed = paidRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const totalPendingDebt = pendingRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);

  const weeklyPaidRecords = paidRecords.filter((r) => r.employee.paymentFrequency === 'SEMANAL');
  const monthlyPaidRecords = paidRecords.filter((r) => r.employee.paymentFrequency === 'MENSUAL');

  const totalWeeklyPaid = weeklyPaidRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const totalMonthlyPaid = monthlyPaidRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const totalAdvancesDeducted = paidRecords.reduce((acc, r) => acc + Number(r.advancesDeduction), 0);

  // Registros a mostrar en la tabla según filtro de estado
  const filteredRecords = payrollRecords.filter((r) => {
    if (paymentStatusFilter === 'PAID') return r.status === 'PAID';
    if (paymentStatusFilter === 'PENDING') return r.status !== 'PAID';
    return true;
  });

  // 2. Datos para Reporte Individual
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  const employeeRecords = payrollRecords.filter(
    (r) => r.employeeId === (selectedEmployee?.id || '')
  );

  const employeeTotalAccumulated = employeeRecords.reduce((acc, r) => acc + Number(r.netAmount), 0);
  const employeeTotalOvertimeHours = employeeRecords.reduce((acc, r) => acc + Number(r.overtimeHours), 0);
  const employeeTotalAdvances = employeeRecords.reduce((acc, r) => acc + Number(r.advancesDeduction), 0);
  const employeeAvgPay = employeeRecords.length > 0 ? employeeTotalAccumulated / employeeRecords.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Centro de Reportes Financieros & Boletas
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consolidación de pagos realizados, control de deudas pendientes y auditoría por trabajador.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setActiveReportTab('MONTHLY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Reporte Mensual Consolidado
          </button>
          <button
            onClick={() => setActiveReportTab('INDIVIDUAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'INDIVIDUAL'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Historial por Trabajador
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: REPORTE MENSUAL CONSOLIDADO (SEMANAL VS MENSUAL) */}
      {/* ========================================================================= */}
      {activeReportTab === 'MONTHLY' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Cards de Desglose Salarial Mensual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Pagado Efectivo */}
            <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-emerald-500/5 to-transparent">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Total Efectivamente Pagado
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono mt-1">
                {currencySymbol} {totalPaidDisbursed.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {paidRecords.length} liquidaciones canceladas
              </p>
            </div>

            {/* 2. Total Pendiente de Pago */}
            <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-tr from-amber-500/5 to-transparent">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Total Pendiente por Liquidar
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {currencySymbol} {totalPendingDebt.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {pendingRecords.length} pagos aún no registrados
              </p>
            </div>

            {/* 3. Semanales Pagados */}
            <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-sky-500 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                Semanales Pagados
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {currencySymbol} {totalWeeklyPaid.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {weeklyPaidRecords.length} boletas semanales abonadas
              </p>
            </div>

            {/* 4. Mensuales Pagados */}
            <div className="glass-panel p-5 rounded-3xl border-t-4 border-t-indigo-600 border-x border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Mensuales Pagados
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {currencySymbol} {totalMonthlyPaid.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {monthlyPaidRecords.length} liquidaciones mensuales abonadas
              </p>
            </div>
          </div>

          {/* Tabla de Planilla Mensual Consolidada */}
          <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm space-y-4 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Consolidado de Nóminas y Estado de Pagos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualiza los trabajadores que ya cobraron su salario con su fecha exacta y aquellos aún pendientes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filtros de Estado de Pago */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setPaymentStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      paymentStatusFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todos ({payrollRecords.length})
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('PAID')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      paymentStatusFilter === 'PAID'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    Solo Pagados ({paidRecords.length})
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      paymentStatusFilter === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    Pendientes ({pendingRecords.length})
                  </button>
                </div>

                <button
                  onClick={() => exportPayrollToExcel(filteredRecords, periods[0])}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Excel ({filteredRecords.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Trabajador</th>
                    <th className="px-4 py-3">Área / Cargo</th>
                    <th className="px-4 py-3 text-center">Modalidad</th>
                    <th className="px-4 py-3 text-right">Sueldo Base</th>
                    <th className="px-4 py-3 text-right">H. Extras / Bonos</th>
                    <th className="px-4 py-3 text-right">Adelanto</th>
                    <th className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                      Líquido Percibido
                    </th>
                    <th className="px-4 py-3 text-center">Estado de Pago</th>
                    <th className="px-4 py-3 text-center">Método & Ref.</th>
                    <th className="px-4 py-3 text-center">Boleta PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {filteredRecords.map((rec) => {
                    const isWeekly = rec.employee.paymentFrequency === 'SEMANAL';
                    const isPaid = rec.status === 'PAID';
                    const period = periods.find((p) => p.id === rec.periodId) || periods[0];

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {rec.employee.lastName}, {rec.employee.firstName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            DNI: {rec.employee.dni}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <div>{rec.employee.position}</div>
                          <span className="text-[10px] text-slate-400 font-semibold">{rec.employee.department}</span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              isWeekly
                                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {rec.employee.paymentFrequency}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {currencySymbol} {Number(rec.baseSalary).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-sky-600 dark:text-sky-400 font-bold">
                          +{currencySymbol} {(Number(rec.overtimeAmount) + Number(rec.bonusesAmount)).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400 font-bold">
                          {rec.advancesDeduction > 0 ? `-${currencySymbol} ${Number(rec.advancesDeduction).toFixed(2)}` : '-'}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {currencySymbol} {Number(rec.netAmount).toFixed(2)}
                        </td>

                        {/* ESTADO DE PAGO */}
                        <td className="px-4 py-3 text-center">
                          {isPaid ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                PAGADO
                              </span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                📅 {rec.paymentDate || 'Registrado'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                PENDIENTE
                              </span>
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">
                                Por Liquidar
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {isPaid ? (
                            <div className="flex flex-col items-center text-[10px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {rec.paymentMethod === 'QR_BANCARIO'
                                  ? 'QR Bancario'
                                  : rec.paymentMethod === 'TRANSFERENCIA'
                                  ? 'Transferencia'
                                  : 'Efectivo en Caja'}
                              </span>
                              {rec.paymentReference && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  Ref: {rec.paymentReference}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => generatePayslipPDF(rec, period)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            title="Descargar Boleta Oficial en PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: HISTORIAL Y REPORTE INDIVIDUAL POR TRABAJADOR */}
      {/* ========================================================================= */}
      {activeReportTab === 'INDIVIDUAL' && selectedEmployee && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Selector de Trabajador */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md">
                {selectedEmployee.firstName.charAt(0)}
                {selectedEmployee.lastName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Seleccionar Trabajador para Auditoría:
                </span>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="bg-transparent text-base font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer border-b border-indigo-500/40 pb-0.5 mt-0.5"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                      {emp.lastName}, {emp.firstName} — {emp.position} ({emp.paymentFrequency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Modalidad: <strong>{selectedEmployee.paymentFrequency}</strong>
              </span>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {selectedEmployee.department}
              </span>
            </div>
          </div>

          {/* Tarjetas de Resumen Acumulado del Trabajador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Salario Base Pactado
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {currencySymbol} {selectedEmployee.baseSalary.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Por {selectedEmployee.paymentFrequency === 'SEMANAL' ? 'Semana (7 días)' : 'Mes (30 días)'}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Total Percibido (Acumulado)
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {currencySymbol} {employeeTotalAccumulated.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {employeeRecords.length} periodos liquidados
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Horas Extras Acumuladas
              </span>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
                {employeeTotalOvertimeHours} hrs
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Al 150% de recargo de ley
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Adelantos Descontados
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                -{currencySymbol} {employeeTotalAdvances.toFixed(0)}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Total retenido en nóminas
              </span>
            </div>
          </div>

          {/* Historial Cronológico de Pagos del Trabajador */}
          <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800/80 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Historial de Pagos & Boletas Emitidas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro detallado de cada liquidación realizada a este trabajador.
                </p>
              </div>
            </div>

            {employeeRecords.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aún no hay periodos de nómina liquidados para este trabajador.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Periodo / Corte</th>
                      <th className="px-4 py-3 text-center">Días Trab.</th>
                      <th className="px-4 py-3 text-right">Sueldo Base</th>
                      <th className="px-4 py-3 text-right">Horas Extras</th>
                      <th className="px-4 py-3 text-right">Bonos / Comis.</th>
                      <th className="px-4 py-3 text-right">Adelantos</th>
                      <th className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                        Líquido Pagado
                      </th>
                      <th className="px-4 py-3 text-center">Método</th>
                      <th className="px-4 py-3 text-center">Reimprimir PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {employeeRecords.map((rec) => {
                      const period = periods.find((p) => p.id === rec.periodId) || periods[0];

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {period.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {period.code} &bull; {period.startDate} al {period.endDate}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                              {rec.workedDays} días
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {currencySymbol} {Number(rec.baseSalary).toFixed(2)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono">
                            {rec.overtimeAmount > 0 ? (
                              <span className="text-sky-600 dark:text-sky-400 font-bold">
                                +{currencySymbol} {Number(rec.overtimeAmount).toFixed(2)} ({rec.overtimeHours}h)
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono">
                            {rec.bonusesAmount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                +{currencySymbol} {Number(rec.bonusesAmount).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono">
                            {rec.advancesDeduction > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-bold">
                                -{currencySymbol} {Number(rec.advancesDeduction).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {currencySymbol} {Number(rec.netAmount).toFixed(2)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {rec.paymentMethod === 'QR_BANCARIO' ? 'QR Bancario' : rec.paymentMethod === 'EFECTIVO' ? 'Efectivo en Caja' : 'Transferencia'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => generatePayslipPDF(rec, period)}
                              className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-bold flex items-center gap-1 mx-auto transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Boleta PDF
                            </button>
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
