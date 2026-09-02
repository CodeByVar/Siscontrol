import React, { useState } from 'react';
import {
  X,
  QrCode,
  CheckCircle2,
  Banknote,
  Building,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { PayrollRecord, PayrollPeriod, PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';
import { sendPayslipViaWhatsApp } from '../lib/whatsappGenerator';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollRecord | null;
  period: PayrollPeriod | null;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  record,
  period,
}) => {
  const { markRecordAsPaid, employees, currencySymbol } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QR_BANCARIO');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !record || !period) return null;

  const liveEmployee = employees.find((e) => e.id === record.employeeId) || record.employee;

  const qrImage =
    liveEmployee.qrImageUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=SIMPLE_QR_${liveEmployee.firstName}_${liveEmployee.lastName}_${record.netAmount}_BS`;

  const isCustomUploadedImage =
    liveEmployee.qrImageUrl && !liveEmployee.qrImageUrl.includes('api.qrserver.com');

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      markRecordAsPaid(record.id, selectedMethod);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Escaneo y Pago por QR Bancario
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{period.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount to pay */}
        <div className="text-center p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/30">
          <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider block">
            TOTAL LÍQUIDO A TRANSFERIR
          </span>
          <div className="text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 tracking-tight">
            {currencySymbol} {Number(record.netAmount).toFixed(2)}
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
            {liveEmployee.lastName}, {liveEmployee.firstName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            DNI: {liveEmployee.dni} &bull; {liveEmployee.position}
          </p>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2 text-xs">
          <label className="font-extrabold text-slate-700 dark:text-slate-300 block">
            Modalidad de Pago Ejecutada:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('QR_BANCARIO')}
              className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                selectedMethod === 'QR_BANCARIO'
                  ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <QrCode className="w-4 h-4 text-sky-500" />
              <span>QR Bancario</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('EFECTIVO')}
              className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                selectedMethod === 'EFECTIVO'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Banknote className="w-4 h-4 text-emerald-500" />
              <span>Efectivo Caja</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('TRANSFERENCIA')}
              className={`p-2.5 rounded-2xl border text-center font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                selectedMethod === 'TRANSFERENCIA'
                  ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building className="w-4 h-4 text-purple-500" />
              <span>Transferencia</span>
            </button>
          </div>
        </div>

        {/* QR Display Card */}
        {selectedMethod === 'QR_BANCARIO' && (
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-inner">
            <div className="p-4 bg-white rounded-3xl border-2 border-slate-300 shadow-md inline-flex items-center justify-center mx-auto">
              <img
                src={qrImage}
                alt={`QR de Cobro de ${liveEmployee.firstName}`}
                className="w-72 sm:w-80 max-h-80 object-contain rounded-2xl"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isCustomUploadedImage
                  ? 'QR Oficial del Trabajador (Listo para Escanear)'
                  : 'QR Simple Bancario (BNB / Banco Unión / BISA)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Abre la aplicación de tu banco en tu celular, enfoca la cámara a la pantalla y transfiere exactamente los <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{currencySymbol} {Number(record.netAmount).toFixed(2)}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Bank Account Display for Transferencia */}
        {selectedMethod === 'TRANSFERENCIA' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Datos de Cuenta Bancaria:</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm">
              {liveEmployee.bankName || 'Banco no especificado'}
            </p>
            <p className="font-mono text-slate-600 dark:text-slate-300">
              Nº Cuenta: {liveEmployee.bankAccountNumber || 'Sin número registrado'}
            </p>
          </div>
        )}

        {/* Cash payment notes */}
        {selectedMethod === 'EFECTIVO' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Pago en Efectivo / Caja Chica
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Al confirmar, el sistema registrará el egreso de efectivo y emitirá la boleta con firma física de conformidad.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => sendPayslipViaWhatsApp(record, period, currencySymbol)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Enviar comprobante al WhatsApp del trabajador"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar a su WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Registrando Pago...' : 'Confirmar Pago'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
