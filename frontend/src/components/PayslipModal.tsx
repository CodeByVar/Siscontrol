import React from 'react';
import { X, Download, FileText, Building2, Calendar, MessageSquare } from 'lucide-react';
import { PayrollRecord, PayrollPeriod } from '../types';
import { generatePayslipPDF } from '../lib/pdfGenerator';
import { sendPayslipViaWhatsApp } from '../lib/whatsappGenerator';
import { useApp } from '../context/AppContext';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  period: PayrollPeriod | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  record,
  period,
}) => {
  const { currencySymbol } = useApp();

  if (!isOpen || !record || !period) return null;

  const earnings = record.items.filter((i) => i.type === 'EARNING');
  const deductions = record.items.filter((i) => i.type === 'DEDUCTION');
  const isWeekly = record.employee.paymentFrequency === 'SEMANAL';
  const scheduleLabel = record.employee.workSchedule === 'LUNES_A_VIERNES' ? 'Lunes a Viernes (5 días)' : 'Lunes a Sábado (6 días)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Previsualización de Boleta de Pago
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period.name} ({record.employee.paymentFrequency})
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

        {/* Payslip Document Preview */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5 shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                IMPORTADORA RIVERO S.R.L.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">NIT: 1029384019 | Zona Comercial Nro. 520</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Recibo de Salario Oficial & Constancia de Pago
              </p>
            </div>

            <div className="text-right">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  record.status === 'PAID'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                }`}
              >
                {record.status === 'PAID' ? 'PAGADO OFICIAL' : 'PENDIENTE DE PAGO'}
              </span>
              <p className="text-xs font-mono text-slate-400 mt-1">
                REF: {record.id.slice(0, 10).toUpperCase()}
              </p>
              {record.paymentDate && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Abonado: {record.paymentDate}
                </p>
              )}
            </div>
          </div>

          {/* Worker Info Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs shadow-sm">
            <div>
              <p className="text-slate-400 text-[11px]">Trabajador:</p>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                {record.employee.lastName}, {record.employee.firstName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                C.I. / DNI: <strong className="text-slate-800 dark:text-slate-200">{record.employee.dni}</strong>
              </p>
            </div>

            <div className="text-right sm:text-left">
              <p className="text-slate-400 text-[11px]">Cargo & Jornada:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {record.employee.position} ({record.employee.department})
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Jornada:{' '}
                <strong className="text-cyan-600 dark:text-cyan-400">{scheduleLabel}</strong>
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Haberes / Ingresos */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 font-extrabold text-sky-600 dark:text-sky-400">
                <span>INGRESOS / HABERES</span>
                <span>MONTO</span>
              </div>
              <div className="space-y-1.5 min-h-[90px]">
                {earnings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-[11px]">{item.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {Number(item.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-extrabold text-slate-900 dark:text-slate-100">
                <span>TOTAL HABERES</span>
                <span className="text-sky-600 dark:text-sky-300 font-mono">
                  {currencySymbol} {Number(record.totalEarnings).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Descuentos */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 font-extrabold text-red-600 dark:text-red-400">
                <span>DESCUENTOS / ADELANTOS</span>
                <span>MONTO</span>
              </div>
              <div className="space-y-1.5 min-h-[90px]">
                {deductions.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Sin deducciones</p>
                ) : (
                  deductions.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="text-[11px]">{item.name}</span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">
                        -{currencySymbol} {Number(item.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 font-extrabold text-slate-900 dark:text-slate-100">
                <span>TOTAL DEDUCCIONES</span>
                <span className="text-red-600 dark:text-red-400 font-mono">
                  -{currencySymbol} {Number(record.totalDeductions).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Líquido Pagable Net Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-700 dark:text-emerald-400 block">
                LÍQUIDO PAGABLE A PERCIBIR (NETO)
              </span>
              <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                {currencySymbol} {Number(record.netAmount).toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                {record.status === 'PAID' ? 'Método & Fecha de Pago' : 'Método de Pago Previsto'}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {record.paymentMethod === 'QR_BANCARIO'
                  ? 'QR Simple Bancario'
                  : record.paymentMethod === 'TRANSFERENCIA'
                  ? 'Transferencia Bancaria'
                  : record.employee.bankName || 'Efectivo en Caja'}
                {record.paymentReference ? ` (Ref: ${record.paymentReference})` : ''}
              </span>
              {record.paymentDate && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                  Abonado el: {record.paymentDate}
                </span>
              )}
            </div>
          </div>

          {/* Firmas */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-500 dark:text-slate-400">
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">IMPORTADORA RIVERO S.R.L.</p>
              <p>Firma y Sello del Empleador</p>
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2">
              <p className="font-bold text-slate-800 dark:text-slate-300">
                {record.employee.lastName}, {record.employee.firstName}
              </p>
              <p>C.I.: {record.employee.dni} (Firma de Conformidad)</p>
            </div>
          </div>
        </div>

        {/* Actions modal footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {/* 📲 Enviar WhatsApp Directo */}
            <button
              onClick={() => sendPayslipViaWhatsApp(record, period, currencySymbol)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar a su WhatsApp
            </button>

            {/* Descargar PDF */}
            <button
              onClick={() => generatePayslipPDF(record, period)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-brand-500 hover:from-sky-500 hover:to-brand-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
