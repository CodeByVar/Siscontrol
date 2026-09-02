import React from 'react';
import {
  Bell,
  X,
  HandCoins,
  CalendarDays,
  CalendarRange,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Sidebar';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: NavTab) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const { advances, periods, payrollRecords, employees, currencySymbol } = useApp();

  if (!isOpen) return null;

  const pendingAdvances = advances.filter((a) => a.status === 'PENDING');
  
  // 1. REGLA SEMANAL: Pago máximo hasta el Domingo
  const openWeeklyRecords = payrollRecords.filter(
    (r) => r.employee.paymentFrequency === 'SEMANAL' && r.status === 'DRAFT'
  );

  // 2. REGLA MENSUAL: Pago último día del mes, máx día 2 del mes entrante
  const openMonthlyRecords = payrollRecords.filter(
    (r) => r.employee.paymentFrequency === 'MENSUAL' && r.status === 'DRAFT'
  );

  const notifications = [
    // Alerta de Vencimiento Semanal
    ...(openWeeklyRecords.length > 0
      ? [
          {
            id: 'notif-weekly-deadline',
            title: `${openWeeklyRecords.length} Sueldo(s) Semanal(es) Pendientes`,
            description: `Plazo de pago: MÁXIMO HASTA EL DOMINGO. Evita retrasos con el personal operativo.`,
            icon: Clock,
            color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
            tab: 'weekly' as NavTab,
            actionLabel: 'Pagar Nómina Semanal',
            isUrgent: true,
          },
        ]
      : []),

    // Alerta de Vencimiento Mensual
    ...(openMonthlyRecords.length > 0
      ? [
          {
            id: 'notif-monthly-deadline',
            title: `${openMonthlyRecords.length} Sueldo(s) Mensual(es) por Liquidar`,
            description: `Plazo de pago: Último día del mes (Máximo hasta el día 2 del mes entrante).`,
            icon: CalendarRange,
            color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
            tab: 'monthly' as NavTab,
            actionLabel: 'Pagar Nómina Mensual',
            isUrgent: true,
          },
        ]
      : []),

    // Alerta de Adelantos
    ...(pendingAdvances.length > 0
      ? [
          {
            id: 'notif-advances',
            title: `${pendingAdvances.length} Adelanto(s) pendiente(s) de corte`,
            description: `Total a descontar: ${currencySymbol} ${pendingAdvances.reduce((acc, a) => acc + Number(a.amount), 0).toLocaleString()}`,
            icon: HandCoins,
            color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
            tab: 'advances' as NavTab,
            actionLabel: 'Ver Adelantos',
            isUrgent: false,
          },
        ]
      : []),

    // Estado del Sistema
    {
      id: 'notif-system',
      title: 'Padrón de Personal Rivero',
      description: `${employees.length} trabajador(es) activos en planilla.`,
      icon: Users,
      color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      tab: 'employees' as NavTab,
      actionLabel: 'Ver Trabajadores',
      isUrgent: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 mr-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Alertas y Plazos de Pago
              </h2>
              <p className="text-[10px] text-slate-400">
                {notifications.length} avisos de nómina
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2.5">
          {notifications.map((n) => {
            const Icon = n.icon;

            return (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border space-y-2 transition-all ${
                  n.isUrgent
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-xl border shrink-0 ${n.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {n.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setActiveTab(n.tab);
                      onClose();
                    }}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm ${
                      n.isUrgent
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-white dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{n.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer con Reglas de Pago Oficiales */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-1 text-[10px] text-slate-500">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            Reglas de Pago Importadora Rivero:
          </p>
          <p>&bull; Semanal: Máximo hasta el <strong>Domingo</strong>.</p>
          <p>&bull; Mensual: Fin de mes (Máx. <strong>día 2 del mes entrante</strong>).</p>
        </div>
      </div>
    </div>
  );
};
