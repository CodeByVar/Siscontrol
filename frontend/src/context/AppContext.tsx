import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Employee,
  Advance,
  PayrollPeriod,
  PayrollRecord,
  UserRole,
  PaymentFrequency,
  PaymentMethod,
} from '../types';

export interface AppUser {
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  password?: string;
}

interface AppContextType {
  // Theme & Auth
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  currencySymbol: string;

  // Data
  employees: Employee[];
  advances: Advance[];
  periods: PayrollPeriod[];
  payrollRecords: PayrollRecord[];

  // Actions
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updatedData: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addAdvance: (adv: {
    employeeId: string;
    amount: number;
    reason: string;
    notes?: string;
    employeeName?: string;
    employeeDni?: string;
    requestDate?: string;
    paymentMethod?: PaymentMethod;
  }) => void;
  deleteAdvance: (id: string) => void;

  addPeriod: (period: Omit<PayrollPeriod, 'id' | 'status' | 'totalGross' | 'totalNet' | 'totalAdvances'>) => void;
  calculatePeriodPayroll: (periodId: string) => void;
  approveAndClosePeriod: (periodId: string) => void;
  updateRecord: (
    recordId: string,
    data: {
      workedDays?: number;
      overtimeHours?: number;
      bonusesAmount?: number;
      otherDeductions?: number;
      paymentMethod?: PaymentMethod;
    }
  ) => void;
  markRecordAsPaid: (recordId: string, method: PaymentMethod) => void;
  resetSystemData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Usuario Administrador Principal
export const SYSTEM_USERS: Record<string, AppUser> = {
  'betito01.hra@gmail.com': {
    name: 'Beto Rivero',
    email: 'betito01.hra@gmail.com',
    role: 'SUPERADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    password: '20202020',
  },
};

// Periodos automáticos predeterminados
const DEFAULT_AUTO_PERIODS: PayrollPeriod[] = [
  {
    id: 'per-sem-actual',
    code: 'SEM-ACTUAL',
    name: 'Semana Actual de Pago (En Curso)',
    frequency: 'SEMANAL',
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    year: 2026,
    periodNumber: 36,
    status: 'OPEN',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
  {
    id: 'per-mes-actual',
    code: 'MES-SEPT-2026',
    name: 'Mes de Septiembre 2026 (01 Sep - 30 Sep)',
    frequency: 'MENSUAL',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    year: 2026,
    periodNumber: 9,
    status: 'OPEN',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
];

// Trabajador registrado por el usuario (Abel Vargas) preservado
const INITIAL_SAVED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-abel-vargas',
    dni: '9517526',
    firstName: 'ABEL',
    lastName: 'VARGAS VIDA',
    phone: '69434357',
    department: 'OFICINA',
    position: 'OFICINA',
    hireDate: '2026-09-01',
    status: 'ACTIVE',
    paymentFrequency: 'MENSUAL',
    workSchedule: 'LUNES_A_VIERNES',
    baseSalary: 2400,
    qrImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SIMPLE_QR_ABEL_VARGAS_VIDA_9517526_BS',
    createdAt: '2026-09-01',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Auth State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    return SYSTEM_USERS['betito01.hra@gmail.com'];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('importrivero_auth_clean_v3') === 'true';
  });

  const currentRole: UserRole = currentUser?.role || 'SUPERADMIN';

  const setCurrentRole = (role: UserRole) => {
    if (currentUser) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
    }
  };

  const login = (email: string, pass: string): boolean => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'betito01.hra@gmail.com' && pass === '20202020') {
      const user = SYSTEM_USERS['betito01.hra@gmail.com'];
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('importrivero_auth_clean_v3', 'true');
      localStorage.setItem('importrivero_user_clean_v3', JSON.stringify(user));
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('importrivero_auth_clean_v3');
  };

  const currencySymbol = 'Bs';

  // Base de datos de Trabajadores (con guardado inmediato)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_employees_v5');
      if (saved && JSON.parse(saved).length > 0) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAVED_EMPLOYEES;
  });

  // Adelantos
  const [advances, setAdvances] = useState<Advance[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_advances_v5');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Periodos
  const [periods, setPeriods] = useState<PayrollPeriod[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_periods_v5');
      return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_AUTO_PERIODS;
    } catch (e) {
      return DEFAULT_AUTO_PERIODS;
    }
  });

  // Registros de Nómina
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_records_v5');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sincronización AUTOMÁTICA de trabajadores con periodos abiertos
  useEffect(() => {
    setPayrollRecords((prevRecords) => {
      let updatedRecords = [...prevRecords];

      const openWeekly = periods.find((p) => p.frequency === 'SEMANAL' && p.status === 'OPEN') || periods.find((p) => p.frequency === 'SEMANAL');
      const openMonthly = periods.find((p) => p.frequency === 'MENSUAL' && p.status === 'OPEN') || periods.find((p) => p.frequency === 'MENSUAL');

      employees.forEach((emp) => {
        const targetPeriod = emp.paymentFrequency === 'SEMANAL' ? openWeekly : openMonthly;
        if (!targetPeriod) return;

        const isWeekly = emp.paymentFrequency === 'SEMANAL';
        const isLunASab = emp.workSchedule === 'LUNES_A_SABADO' || (!emp.workSchedule && isWeekly);
        const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);

        const existingRecord = updatedRecords.find(
          (r) => r.periodId === targetPeriod.id && r.employeeId === emp.id
        );

        const pendingAdvances = advances.filter(
          (a) => a.employeeId === emp.id && a.status === 'PENDING'
        );
        const advancesSum = pendingAdvances.reduce((acc, a) => acc + Number(a.amount), 0);

        if (!existingRecord) {
          const totalEarnings = emp.baseSalary;
          const totalDeductions = advancesSum;
          const netAmount = Math.max(0, totalEarnings - totalDeductions);

          updatedRecords.push({
            id: `rec-${targetPeriod.id}-${emp.id}`,
            periodId: targetPeriod.id,
            employeeId: emp.id,
            employee: emp,
            baseSalary: emp.baseSalary,
            workedDays: standardDays,
            overtimeHours: 0,
            overtimeAmount: 0,
            bonusesAmount: 0,
            advancesDeduction: advancesSum,
            otherDeductions: 0,
            totalEarnings,
            totalDeductions,
            netAmount,
            status: 'DRAFT',
            paymentMethod: 'QR_BANCARIO',
            items: [
              {
                id: '1',
                name: `Salario Base (${standardDays} días)`,
                type: 'EARNING',
                amount: emp.baseSalary,
              },
              ...(advancesSum > 0
                ? [
                    {
                      id: '2',
                      name: 'Deducción de Adelanto',
                      type: 'DEDUCTION' as const,
                      amount: advancesSum,
                    },
                  ]
                : []),
            ],
          });
        } else {
          updatedRecords = updatedRecords.map((rec) => {
            if (rec.id === existingRecord.id && rec.status === 'DRAFT') {
              const dailyRate = emp.baseSalary / standardDays;
              const earnedBase = Number((dailyRate * rec.workedDays).toFixed(2));
              const totalEarnings = earnedBase + Number(rec.overtimeAmount) + Number(rec.bonusesAmount);
              const totalDeductions = advancesSum + Number(rec.otherDeductions);
              const netAmount = Math.max(0, totalEarnings - totalDeductions);

              return {
                ...rec,
                employee: emp,
                baseSalary: emp.baseSalary,
                advancesDeduction: advancesSum,
                totalEarnings,
                totalDeductions,
                netAmount,
              };
            }
            return rec;
          });
        }
      });

      localStorage.setItem('importrivero_records_v5', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  }, [employees, advances, periods]);

  // Guardado persistente inmediato
  useEffect(() => {
    localStorage.setItem('importrivero_employees_v5', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('importrivero_advances_v5', JSON.stringify(advances));
  }, [advances]);

  useEffect(() => {
    localStorage.setItem('importrivero_periods_v5', JSON.stringify(periods));
  }, [periods]);

  // Manejador del Tema
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Acciones de Empleados
  const addEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      qrImageUrl: empData.qrImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SIMPLE_QR_${empData.firstName.toUpperCase()}_${empData.lastName.toUpperCase()}_${empData.dni}_BS`,
    };
    
    setEmployees((prev) => {
      const updated = [newEmp, ...prev];
      localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const updateEmployee = (id: string, updatedData: Partial<Employee>) => {
    setEmployees((prev) => {
      const updated = prev.map((emp) => (emp.id === id ? { ...emp, ...updatedData } : emp));
      localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
      return updated;
    });
    setPayrollRecords((prev) => {
      const updated = prev.filter((r) => r.employeeId !== id);
      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });
  };

  // Acciones de Adelantos
  const addAdvance = (advData: {
    employeeId: string;
    amount: number;
    reason: string;
    notes?: string;
    employeeName?: string;
    employeeDni?: string;
    requestDate?: string;
    paymentMethod?: PaymentMethod;
  }) => {
    const emp = employees.find((e) => e.id === advData.employeeId);
    const newAdv: Advance = {
      id: `adv-${Date.now()}`,
      employeeId: advData.employeeId,
      employeeName: advData.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Desconocido'),
      employeeDni: advData.employeeDni || emp?.dni || '',
      amount: advData.amount,
      reason: advData.reason,
      requestDate: advData.requestDate || new Date().toISOString().split('T')[0],
      status: 'PENDING',
      notes: advData.notes,
      paymentMethod: advData.paymentMethod,
    };
    setAdvances((prev) => {
      const updated = [newAdv, ...prev];
      localStorage.setItem('importrivero_advances_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  const deleteAdvance = (id: string) => {
    setAdvances((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem('importrivero_advances_v5', JSON.stringify(updated));
      return updated;
    });
  };

  // Acciones de Periodos
  const addPeriod = (periodData: Omit<PayrollPeriod, 'id' | 'status' | 'totalGross' | 'totalNet' | 'totalAdvances'>) => {
    const newPeriod: PayrollPeriod = {
      ...periodData,
      id: `per-${Date.now()}`,
      status: 'OPEN',
      totalGross: 0,
      totalNet: 0,
      totalAdvances: 0,
    };

    setPeriods((prev) => {
      const updated = [newPeriod, ...prev];
      localStorage.setItem('importrivero_periods_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const calculatePeriodPayroll = (periodId: string) => {
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;

    setPayrollRecords((prev) => {
      const updated = prev.map((rec) => {
        if (rec.periodId === periodId) {
          const isWeekly = rec.employee.paymentFrequency === 'SEMANAL';
          const isLunASab = rec.employee.workSchedule === 'LUNES_A_SABADO' || (!rec.employee.workSchedule && isWeekly);
          const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);
          const regularHours = isWeekly ? (isLunASab ? 48 : 40) : (isLunASab ? 192 : 160);

          const dailyRate = rec.baseSalary / standardDays;
          const earnedBase = Number((dailyRate * rec.workedDays).toFixed(2));
          const hourlyRate = rec.baseSalary / regularHours;
          const overtimeAmount = Number((rec.overtimeHours * hourlyRate * 1.5).toFixed(2));
          const totalEarnings = Number((earnedBase + overtimeAmount + rec.bonusesAmount).toFixed(2));
          const totalDeductions = Number((rec.advancesDeduction + rec.otherDeductions).toFixed(2));
          const netAmount = Number(Math.max(0, totalEarnings - totalDeductions).toFixed(2));

          const items = [
            {
              id: '1',
              name: `Salario Devengado (${rec.workedDays}/${standardDays} días pactados)`,
              type: 'EARNING' as const,
              amount: earnedBase,
            },
            ...(overtimeAmount > 0
              ? [
                  {
                    id: '2',
                    name: `Horas Extras (${rec.overtimeHours} hrs al 150%)`,
                    type: 'EARNING' as const,
                    amount: overtimeAmount,
                  },
                ]
              : []),
            ...(rec.bonusesAmount > 0
              ? [
                  {
                    id: '3',
                    name: 'Bonos / Comisiones / Incentivos',
                    type: 'EARNING' as const,
                    amount: rec.bonusesAmount,
                  },
                ]
              : []),
            ...(rec.advancesDeduction > 0
              ? [
                  {
                    id: '4',
                    name: 'Deducción de Adelantos Salariales',
                    type: 'DEDUCTION' as const,
                    amount: rec.advancesDeduction,
                  },
                ]
              : []),
            ...(rec.otherDeductions > 0
              ? [
                  {
                    id: '5',
                    name: 'Otras Retenciones de Ley',
                    type: 'DEDUCTION' as const,
                    amount: rec.otherDeductions,
                  },
                ]
              : []),
          ];

          return {
            ...rec,
            overtimeAmount,
            totalEarnings,
            totalDeductions,
            netAmount,
            items,
          };
        }
        return rec;
      });

      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const updateRecord = (
    recordId: string,
    data: {
      workedDays?: number;
      overtimeHours?: number;
      bonusesAmount?: number;
      otherDeductions?: number;
      paymentMethod?: PaymentMethod;
    }
  ) => {
    setPayrollRecords((prev) => {
      const updated = prev.map((rec) => {
        if (rec.id === recordId) {
          const isWeekly = rec.employee.paymentFrequency === 'SEMANAL';
          const isLunASab = rec.employee.workSchedule === 'LUNES_A_SABADO' || (!rec.employee.workSchedule && isWeekly);
          const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);
          const regularHours = isWeekly ? (isLunASab ? 48 : 40) : (isLunASab ? 192 : 160);

          const workedDays = data.workedDays !== undefined ? data.workedDays : rec.workedDays;
          const overtimeHours = data.overtimeHours !== undefined ? data.overtimeHours : rec.overtimeHours;
          const bonusesAmount = data.bonusesAmount !== undefined ? data.bonusesAmount : rec.bonusesAmount;
          const otherDeductions = data.otherDeductions !== undefined ? data.otherDeductions : rec.otherDeductions;
          const paymentMethod = data.paymentMethod !== undefined ? data.paymentMethod : rec.paymentMethod;

          const dailyRate = rec.baseSalary / standardDays;
          const earnedBase = Number((dailyRate * workedDays).toFixed(2));
          const hourlyRate = rec.baseSalary / regularHours;
          const overtimeAmount = Number((overtimeHours * hourlyRate * 1.5).toFixed(2));
          const totalEarnings = Number((earnedBase + overtimeAmount + bonusesAmount).toFixed(2));
          const totalDeductions = Number((rec.advancesDeduction + otherDeductions).toFixed(2));
          const netAmount = Number(Math.max(0, totalEarnings - totalDeductions).toFixed(2));

          return {
            ...rec,
            workedDays,
            overtimeHours,
            overtimeAmount,
            bonusesAmount,
            otherDeductions,
            totalEarnings,
            totalDeductions,
            netAmount,
            paymentMethod,
          };
        }
        return rec;
      });

      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });
  };

  const markRecordAsPaid = (recordId: string, method: PaymentMethod) => {
    setPayrollRecords((prev) => {
      const updated: PayrollRecord[] = prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              status: 'PAID' as const,
              paymentMethod: method,
              paymentDate: new Date().toISOString().split('T')[0],
            }
          : rec
      );
      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const approveAndClosePeriod = (periodId: string) => {
    setPayrollRecords((prev) => {
      const updated: PayrollRecord[] = prev.map((r) =>
        r.periodId === periodId
          ? { ...r, status: 'PAID' as const, paymentDate: new Date().toISOString().split('T')[0] }
          : r
      );
      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });

    const records = payrollRecords.filter((r) => r.periodId === periodId);
    const totalGross = records.reduce((acc, r) => acc + Number(r.totalEarnings), 0);
    const totalNet = records.reduce((acc, r) => acc + Number(r.netAmount), 0);
    const totalAdvances = records.reduce((acc, r) => acc + Number(r.advancesDeduction), 0);

    setPeriods((prev) => {
      const updated: PayrollPeriod[] = prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status: 'CLOSED' as const,
              totalGross,
              totalNet,
              totalAdvances,
              closedAt: new Date().toISOString().split('T')[0],
            }
          : p
      );
      localStorage.setItem('importrivero_periods_v5', JSON.stringify(updated));
      return updated;
    });

    records.forEach((rec) => {
      if (rec.advancesDeduction > 0) {
        setAdvances((prev) => {
          const updated: Advance[] = prev.map((a) =>
            a.employeeId === rec.employeeId && a.status === 'PENDING'
              ? { ...a, status: 'DEDUCTED' as const, deductedDate: new Date().toISOString().split('T')[0] }
              : a
          );
          localStorage.setItem('importrivero_advances_v5', JSON.stringify(updated));
          return updated;
        });
      }
    });

    // Auto-abrir automáticamente el siguiente periodo
    const currentClosed = periods.find((p) => p.id === periodId);
    if (currentClosed) {
      const nextFreq = currentClosed.frequency;
      const nextName = nextFreq === 'SEMANAL' ? `Semana Siguiente (En Curso)` : `Siguiente Mes (En Curso)`;
      const newNextPeriod: PayrollPeriod = {
        id: `per-${Date.now()}`,
        code: `${nextFreq === 'SEMANAL' ? 'SEM' : 'MES'}-${Date.now().toString().slice(-4)}`,
        name: nextName,
        frequency: nextFreq,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        year: 2026,
        periodNumber: currentClosed.periodNumber + 1,
        status: 'OPEN',
        totalGross: 0,
        totalNet: 0,
        totalAdvances: 0,
      };
      setPeriods((prev) => {
        const updated = [newNextPeriod, ...prev];
        localStorage.setItem('importrivero_periods_v5', JSON.stringify(updated));
        return updated;
      });
    }

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const resetSystemData = () => {
    setEmployees([]);
    setAdvances([]);
    setPeriods(DEFAULT_AUTO_PERIODS);
    setPayrollRecords([]);
    localStorage.removeItem('importrivero_employees_v5');
    localStorage.removeItem('importrivero_advances_v5');
    localStorage.removeItem('importrivero_periods_v5');
    localStorage.removeItem('importrivero_records_v5');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        isAuthenticated,
        currentUser,
        currentRole,
        setCurrentRole,
        login,
        logout,
        currencySymbol,
        employees,
        advances,
        periods,
        payrollRecords,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addAdvance,
        deleteAdvance,
        addPeriod,
        calculatePeriodPayroll,
        approveAndClosePeriod,
        updateRecord,
        markRecordAsPaid,
        resetSystemData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
