import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  HandCoins,
  FileSpreadsheet,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type NavTab = 'dashboard' | 'weekly' | 'monthly' | 'employees' | 'advances' | 'attendance' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentRole, advances, periods } = useApp();

  const pendingAdvancesCount = advances.filter((a) => a.status === 'PENDING').length;
  const openWeeklyPeriods = periods.filter((p) => p.frequency === 'SEMANAL' && p.status !== 'CLOSED').length;
  const openMonthlyPeriods = periods.filter((p) => p.frequency === 'MENSUAL' && p.status !== 'CLOSED').length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard General',
      icon: LayoutDashboard,
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'VENTAS', 'LOGISTICA'],
    },
    {
      id: 'weekly' as NavTab,
      label: 'Nómina Semanal',
      icon: CalendarDays,
      badge: openWeeklyPeriods > 0 ? `${openWeeklyPeriods} Activo` : undefined,
      badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'LOGISTICA'],
    },
    {
      id: 'monthly' as NavTab,
      label: 'Nómina Mensual',
      icon: CalendarRange,
      badge: openMonthlyPeriods > 0 ? `${openMonthlyPeriods} Activo` : undefined,
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'VENTAS'],
    },
    {
      id: 'employees' as NavTab,
      label: 'Trabajadores / Sueldos',
      icon: Users,
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA'],
    },
    {
      id: 'advances' as NavTab,
      label: 'Adelantos & Anticipos',
      icon: HandCoins,
      badge: pendingAdvancesCount > 0 ? `${pendingAdvancesCount} Pend.` : undefined,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'VENTAS', 'LOGISTICA'],
    },
    {
      id: 'attendance' as NavTab,
      label: 'Asistencias & GPS',
      icon: Clock,
      badge: 'GPS',
      badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'VENTAS', 'LOGISTICA'],
    },
    {
      id: 'reports' as NavTab,
      label: 'Reportes & Boletas PDF',
      icon: FileSpreadsheet,
      roles: ['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA', 'VENTAS', 'LOGISTICA'],
    },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-200 dark:border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto transition-colors duration-200">
      <div className="space-y-6">
        <div className="px-3 py-1">
          <p className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
            Módulos del Sistema
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAccessible = item.roles.includes(currentRole);
            const isActive = activeTab === item.id;

            if (!isAccessible) {
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-sky-500 text-white shadow-lg shadow-sky-500/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 px-2 text-[11px] text-slate-400 text-center font-medium">
        <p>ImportRivero &bull; v2.0</p>
      </div>
    </aside>
  );
};
