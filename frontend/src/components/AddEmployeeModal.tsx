import React, { useState } from 'react';
import { X, UserPlus, QrCode, Upload, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentFrequency, UserRole, WorkSchedule } from '../types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose }) => {
  const { addEmployee, currencySymbol } = useApp();

  const [formData, setFormData] = useState({
    dni: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'LOGISTICA' as UserRole,
    position: '',
    paymentFrequency: 'SEMANAL' as PaymentFrequency,
    workSchedule: 'LUNES_A_SABADO' as WorkSchedule,
    baseSalary: '',
    bankName: '',
    bankAccountNumber: '',
    qrImageUrl: '',
  });

  const [qrPreview, setQrPreview] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({ ...prev, qrImageUrl: base64 }));
        setQrPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSampleQR = () => {
    const generated = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SIMPLE_QR_${formData.firstName.toUpperCase() || 'TRABAJADOR'}_${formData.lastName.toUpperCase() || 'RIVERO'}_${formData.dni || '00000'}_BS`;
    setFormData((prev) => ({ ...prev, qrImageUrl: generated }));
    setQrPreview(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni || !formData.firstName || !formData.lastName || !formData.baseSalary) {
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }

    addEmployee({
      dni: formData.dni,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      department: formData.department,
      position: formData.position || 'Operario',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      paymentFrequency: formData.paymentFrequency,
      workSchedule: formData.workSchedule,
      baseSalary: Number(formData.baseSalary),
      bankName: formData.bankName || undefined,
      bankAccountNumber: formData.bankAccountNumber || undefined,
      qrImageUrl: formData.qrImageUrl || qrPreview || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 lg:p-7 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Registrar Nuevo Trabajador
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ficha laboral, jornada de trabajo, salario y código QR de cobro
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
          {/* Modalidad de Pago destacada */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              Modalidad de Cobro del Salario *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  formData.paymentFrequency === 'SEMANAL'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-950 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="freq"
                  checked={formData.paymentFrequency === 'SEMANAL'}
                  onChange={() => setFormData({ ...formData, paymentFrequency: 'SEMANAL', workSchedule: 'LUNES_A_SABADO' })}
                  className="hidden"
                />
                <div>
                  <span className="font-bold block text-sky-600 dark:text-sky-400">PAGO SEMANAL</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Almacén, Choferes (7 días)</span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  formData.paymentFrequency === 'MENSUAL'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="freq"
                  checked={formData.paymentFrequency === 'MENSUAL'}
                  onChange={() => setFormData({ ...formData, paymentFrequency: 'MENSUAL', workSchedule: 'LUNES_A_VIERNES' })}
                  className="hidden"
                />
                <div>
                  <span className="font-bold block text-emerald-600 dark:text-emerald-400">PAGO MENSUAL</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Oficina, Ventas (30 días)</span>
                </div>
              </label>
            </div>
          </div>

          {/* 📅 DÍAS QUE TRABAJA / JORNADA LABORAL */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 space-y-2.5">
            <label className="font-extrabold text-cyan-950 dark:text-cyan-300 flex items-center gap-1.5 block">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Días que Trabaja (Jornada Laboral) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  formData.workSchedule === 'LUNES_A_SABADO'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-950 dark:text-white shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="schedule_add"
                  checked={formData.workSchedule === 'LUNES_A_SABADO'}
                  onChange={() => setFormData({ ...formData, workSchedule: 'LUNES_A_SABADO' })}
                  className="hidden"
                />
                <div>
                  <span className="font-bold block text-cyan-700 dark:text-cyan-300">
                    DE LUNES A SÁBADO (6 días)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Operativos, Choferes y Almacén
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  formData.workSchedule === 'LUNES_A_VIERNES'
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-950 dark:text-white shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="schedule_add"
                  checked={formData.workSchedule === 'LUNES_A_VIERNES'}
                  onChange={() => setFormData({ ...formData, workSchedule: 'LUNES_A_VIERNES' })}
                  className="hidden"
                />
                <div>
                  <span className="font-bold block text-indigo-700 dark:text-indigo-300">
                    DE LUNES A VIERNES (5 días)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Oficina, Ventas y Contabilidad
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Nombres *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="Ej. Juan Carlos"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Apellidos *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="Ej. Quispe Mamani"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">C.I. / DNI *</label>
              <input
                type="text"
                required
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                placeholder="Ej. 6392018"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="+591 7XXXXXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Área / Departamento *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as UserRole })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-500"
              >
                <option value="LOGISTICA" className="bg-white dark:bg-slate-900">LOGÍSTICA / ALMACÉN</option>
                <option value="VENTAS" className="bg-white dark:bg-slate-900">VENTAS & COMERCIAL</option>
                <option value="OFICINA" className="bg-white dark:bg-slate-900">OFICINA & ADMINISTRACIÓN</option>
              </select>
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Cargo / Puesto *</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="Ej. Chofer Distribuidor"
              />
            </div>
          </div>

          {/* Salario Base */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <label className="text-slate-800 dark:text-slate-200 font-bold mb-1 block">
              Salario Base Acordado ({formData.paymentFrequency === 'SEMANAL' ? 'Por Semana' : 'Por Mes'}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-500 font-mono"
                placeholder="Ej. 750 (semanal) o 4500 (mensual)"
              />
            </div>
          </div>

          {/* Datos Bancarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-medium mb-1 block">Banco (o Efectivo)</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="Ej. Banco Unión o Efectivo"
              />
            </div>
            <div>
              <label className="text-slate-600 dark:text-slate-400 font-medium mb-1 block">Nº de Cuenta</label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                placeholder="Ej. 1029-4821-33"
              />
            </div>
          </div>

          {/* 📷 QR BANCARIO DE COBRO */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Código QR de Cobro del Trabajador
              </label>
              <button
                type="button"
                onClick={handleGenerateSampleQR}
                className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-bold"
              >
                Generar QR de Prueba
              </button>
            </div>

            <div className="flex items-center gap-4">
              {qrPreview ? (
                <div className="w-16 h-16 rounded-xl bg-white p-1 border border-slate-300 shadow-sm shrink-0 flex items-center justify-center">
                  <img src={qrPreview} alt="QR Preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center text-slate-400">
                  <QrCode className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 space-y-1">
                <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer w-fit shadow-sm text-xs">
                  <Upload className="w-3.5 h-3.5 text-brand-500" />
                  Subir Imagen QR
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  El jefe podrá escanear este QR desde la pantalla para pagarle al instante.
                </p>
              </div>
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all"
            >
              Guardar Trabajador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
