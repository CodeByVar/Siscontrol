import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { WeeklyPayrollView } from './components/WeeklyPayrollView';
import { MonthlyPayrollView } from './components/MonthlyPayrollView';
import { AdvancesView } from './components/AdvancesView';
import { ReportsView } from './components/ReportsView';
import { LoginView } from './components/LoginView';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { AddAdvanceModal } from './components/AddAdvanceModal';
import { AddPeriodModal } from './components/AddPeriodModal';
import { EditRecordModal } from './components/EditRecordModal';
import { PayslipModal } from './components/PayslipModal';
import { PaymentQRModal } from './components/PaymentQRModal';
import { SearchModal } from './components/SearchModal';
import { NotificationsModal } from './components/NotificationsModal';
import { EmployeeDrawer } from './components/EmployeeDrawer';
import { PayrollRecord, PayrollPeriod, Employee } from './types';
import { useApp } from './context/AppContext';

export const App: React.FC = () => {
  const { theme, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Search & Notifications State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modal States
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [periodFreqForModal, setPeriodFreqForModal] = useState<'SEMANAL' | 'MENSUAL'>('SEMANAL');

  // Drawer & Payslip & Payment QR Data
  const [drawerData, setDrawerData] = useState<{
    record: PayrollRecord | null;
    period: PayrollPeriod | null;
  }>({ record: null, period: null });

  const [paymentQRData, setPaymentQRData] = useState<{
    record: PayrollRecord | null;
    period: PayrollPeriod | null;
  }>({ record: null, period: null });

  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [payslipModalData, setPayslipModalData] = useState<{
    record: PayrollRecord | null;
    period: PayrollPeriod | null;
  }>({ record: null, period: null });

  // Atajo de teclado Ctrl+K para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenAddPeriod = (freq: 'SEMANAL' | 'MENSUAL') => {
    setPeriodFreqForModal(freq);
    setIsAddPeriodOpen(true);
  };

  const handleOpenDrawer = (record: PayrollRecord, period: PayrollPeriod) => {
    setDrawerData({ record, period });
  };

  const handleOpenPayslip = (record: PayrollRecord, period: PayrollPeriod) => {
    setPayslipModalData({ record, period });
  };

  const handleOpenPaymentQR = (record: PayrollRecord, period: PayrollPeriod) => {
    setPaymentQRData({ record, period });
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
  };

  return (
    <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-50 text-slate-900'} flex flex-col selection:bg-brand-500 selection:text-white transition-colors duration-200`}>
      {/* Top Navbar Fija */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Container Principal */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-5rem)]">
        {/* Sidebar Fijo a la Izquierda */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Contenido Central con Scroll Independiente */}
        <main className="flex-1 h-full overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              openAddEmployeeModal={() => setIsAddEmployeeOpen(true)}
              openAddAdvanceModal={() => setIsAddAdvanceOpen(true)}
            />
          )}

          {activeTab === 'weekly' && (
            <WeeklyPayrollView
              onSelectRecordForDrawer={handleOpenDrawer}
              onOpenPayslip={handleOpenPayslip}
              onOpenAddPeriod={handleOpenAddPeriod}
              onOpenPaymentQR={handleOpenPaymentQR}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyPayrollView
              onSelectRecordForDrawer={handleOpenDrawer}
              onOpenPayslip={handleOpenPayslip}
              onOpenAddPeriod={handleOpenAddPeriod}
              onOpenPaymentQR={handleOpenPaymentQR}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              openAddEmployeeModal={() => setIsAddEmployeeOpen(true)}
              onEditEmployee={handleOpenEditEmployee}
            />
          )}

          {activeTab === 'advances' && (
            <AdvancesView openAddAdvanceModal={() => setIsAddAdvanceOpen(true)} />
          )}

          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>

      {/* Modal de Búsqueda Global de Trabajadores (SearchModal) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectEmployee={(emp) => {
          setActiveTab('employees');
          handleOpenEditEmployee(emp);
        }}
        onViewQR={(emp) => {
          setActiveTab('employees');
        }}
      />

      {/* Modal de Notificaciones y Alertas (NotificationsModal) */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Slide-over Drawer Panel */}
      <EmployeeDrawer
        isOpen={!!drawerData.record}
        onClose={() => setDrawerData({ record: null, period: null })}
        record={drawerData.record}
        period={drawerData.period}
      />

      {/* Modal de Pago por QR / Efectivo */}
      <PaymentQRModal
        isOpen={!!paymentQRData.record}
        onClose={() => setPaymentQRData({ record: null, period: null })}
        record={paymentQRData.record}
        period={paymentQRData.period}
      />

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
      />

      <EditEmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
      />

      <AddAdvanceModal
        isOpen={isAddAdvanceOpen}
        onClose={() => setIsAddAdvanceOpen(false)}
      />

      <AddPeriodModal
        isOpen={isAddPeriodOpen}
        onClose={() => setIsAddPeriodOpen(false)}
        defaultFrequency={periodFreqForModal}
      />

      <EditRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
      />

      <PayslipModal
        isOpen={!!payslipModalData.record}
        onClose={() => setPayslipModalData({ record: null, period: null })}
        record={payslipModalData.record}
        period={payslipModalData.period}
      />
    </div>
  );
};
export default App;
