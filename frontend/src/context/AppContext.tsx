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
  AttendanceRecord,
  AttendanceType,
} from '../types';
import { api, getBackendBaseUrl, setBackendBaseUrl, setAuthToken, getAuthToken } from '../lib/api';

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
  login: (email: string, pass: string) => Promise<boolean> | boolean;
  logout: () => void;
  currencySymbol: string;

  // Privacy & Inactivity
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatMoney: (val: number | string) => string;
  inactivityCountdown: number | null;
  resetInactivityTimer: () => void;
  changeUserPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Backend Sync Status
  backendStatus: 'connected' | 'connecting' | 'offline';
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  syncWithBackend: () => Promise<void>;

  // Data
  employees: Employee[];
  advances: Advance[];
  periods: PayrollPeriod[];
  payrollRecords: PayrollRecord[];
  attendances: AttendanceRecord[];

  // Attendance Actions
  fetchAttendances: (date?: string) => Promise<void>;
  recordAttendanceCheck: (data: {
    dni: string;
    type?: AttendanceType;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    notes?: string;
  }) => Promise<{ success: boolean; message: string; data?: any }>;

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
  markRecordAsPaid: (
    recordId: string,
    method: PaymentMethod,
    paymentDate?: string,
    paymentReference?: string,
    paymentNotes?: string
  ) => void;
  markRecordAsUnpaid: (recordId: string) => void;
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

// Periodos automáticos predeterminados (Semana 1 inició el lunes 31 de Agosto)
const DEFAULT_AUTO_PERIODS: PayrollPeriod[] = [
  {
    id: 'per-sem-1-sept-2026',
    code: 'SEM-1-SEPT-2026',
    name: 'Semana 1 (31 Ago - 06 Sep)',
    frequency: 'SEMANAL',
    startDate: '2026-08-31',
    endDate: '2026-09-06',
    year: 2026,
    periodNumber: 1,
    status: 'CLOSED',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
  {
    id: 'per-sem-2-sept-2026',
    code: 'SEM-2-SEPT-2026',
    name: 'Semana 2 (07 Sep - 13 Sep)',
    frequency: 'SEMANAL',
    startDate: '2026-09-07',
    endDate: '2026-09-13',
    year: 2026,
    periodNumber: 2,
    status: 'OPEN',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
  {
    id: 'per-sem-3-sept-2026',
    code: 'SEM-3-SEPT-2026',
    name: 'Semana 3 (14 Sep - 20 Sep)',
    frequency: 'SEMANAL',
    startDate: '2026-09-14',
    endDate: '2026-09-20',
    year: 2026,
    periodNumber: 3,
    status: 'OPEN',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
  {
    id: 'per-sem-4-sept-2026',
    code: 'SEM-4-SEPT-2026',
    name: 'Semana 4 (21 Sep - 27 Sep)',
    frequency: 'SEMANAL',
    startDate: '2026-09-21',
    endDate: '2026-09-27',
    year: 2026,
    periodNumber: 4,
    status: 'OPEN',
    totalGross: 0,
    totalNet: 0,
    totalAdvances: 0,
  },
  {
    id: 'per-sem-5-sept-2026',
    code: 'SEM-5-SEPT-2026',
    name: 'Semana 5 (28 Sep - 04 Oct)',
    frequency: 'SEMANAL',
    startDate: '2026-09-28',
    endDate: '2026-10-04',
    year: 2026,
    periodNumber: 5,
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

// Función de deduplicación estricta por Carnet de Identidad (DNI)
export const deduplicateEmployees = (list: Employee[]): Employee[] => {
  const map = new Map<string, Employee>();
  list.forEach((emp) => {
    const key = emp.dni ? String(emp.dni).trim() : emp.id;
    const existing = map.get(key);
    // Si ya existe uno local (emp-*) y el nuevo tiene UUID oficial de la BD, preferir el de la BD
    if (!existing || (!emp.id.startsWith('emp-') && existing.id.startsWith('emp-'))) {
      map.set(key, emp);
    }
  });
  return Array.from(map.values());
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Backend Connection State
  const [backendStatus, setBackendStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [backendUrl, setBackendUrlState] = useState<string>(getBackendBaseUrl());

  const setBackendUrl = (url: string) => {
    setBackendBaseUrl(url);
    setBackendUrlState(getBackendBaseUrl());
    syncWithBackend();
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('importrivero_user_clean_v3');
      if (savedUser) return JSON.parse(savedUser);
    } catch {}
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

  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Intento con Backend API en PostgreSQL (Render)
    try {
      setBackendStatus('connecting');
      const res = await api.auth.login(cleanEmail, pass);
      if (res && res.token) {
        setAuthToken(res.token);
        const user: AppUser = {
          name: res.user.name,
          email: res.user.email,
          role: (res.user.role as UserRole) || 'SUPERADMIN',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('importrivero_auth_clean_v3', 'true');
        localStorage.setItem('importrivero_user_clean_v3', JSON.stringify(user));
        setBackendStatus('connected');
        syncWithBackend();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        return true;
      }
    } catch (apiErr) {
      console.warn('Backend login no respondió, utilizando autenticación local:', apiErr);
      setBackendStatus('offline');
    }

    // 2. Fallback de autenticación local si el backend está suspendido o en modo offline
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
    setAuthToken(null);
    localStorage.removeItem('importrivero_auth_clean_v3');
    localStorage.removeItem('importrivero_user_clean_v3');
  };

  const currencySymbol = 'Bs';

  // Modo Privacidad (Ocultar montos y salarios)
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('importrivero_privacy_mode') === 'true';
  });

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('importrivero_privacy_mode', String(next));
      return next;
    });
  };

  const formatMoney = (val: number | string): string => {
    if (isPrivacyMode) {
      return `${currencySymbol} ••••••`;
    }
    const num = Number(val) || 0;
    return `${currencySymbol} ${num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Temporizador de Inactividad (10 minutos con advertencia en el minuto 9)
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);
  const lastActiveRef = React.useRef<number>(Date.now());

  const resetInactivityTimer = () => {
    lastActiveRef.current = Date.now();
    setInactivityCountdown(null);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      if (inactivityCountdown !== null) {
        setInactivityCountdown(null);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const checkInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActiveRef.current) / 1000);
      const totalTimeout = 10 * 60; // 10 minutos (600s)
      const warningThreshold = 9 * 60; // Mostrar advertencia a los 9 minutos (540s)

      if (elapsedSeconds >= totalTimeout) {
        logout();
        setInactivityCountdown(null);
      } else if (elapsedSeconds >= warningThreshold) {
        const remaining = totalTimeout - elapsedSeconds;
        setInactivityCountdown(remaining);
      } else {
        if (inactivityCountdown !== null) {
          setInactivityCountdown(null);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(checkInterval);
    };
  }, [isAuthenticated]);

  // Cambio de contraseña seguro con Backend / PostgreSQL
  const changeUserPassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.auth.changePassword(currentPass, newPass);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      return { success: true, message: res?.message || 'Contraseña cambiada exitosamente' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al cambiar la contraseña' };
    }
  };

  // Base de datos de Trabajadores (con guardado inmediato y deduplicación por DNI)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_employees_v5');
      if (saved && JSON.parse(saved).length > 0) {
        return deduplicateEmployees(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    return deduplicateEmployees(INITIAL_SAVED_EMPLOYEES);
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
      let currentList: PayrollPeriod[] = [];
      if (saved && JSON.parse(saved).length > 0) {
        currentList = JSON.parse(saved);
      } else {
        currentList = [...DEFAULT_AUTO_PERIODS];
      }

      // Eliminar periodos obsoletos o con desfases anteriores (como Semana 36)
      currentList = currentList.filter(
        (p) =>
          p.id !== 'per-sem-actual' &&
          p.code !== 'SEM-ACTUAL' &&
          p.periodNumber !== 36 &&
          !(p.startDate === '2026-09-01' && p.endDate === '2026-09-07') &&
          !(p.startDate === '2026-09-01' && p.endDate === '2026-09-06')
      );

      // Asegurar que las 5 semanas oficiales existan con sus fechas exactas
      DEFAULT_AUTO_PERIODS.forEach((defP) => {
        const idx = currentList.findIndex((p) => p.id === defP.id || p.code === defP.code);
        if (idx === -1) {
          currentList.push(defP);
        } else {
          currentList[idx] = {
            ...currentList[idx],
            startDate: defP.startDate,
            endDate: defP.endDate,
            name: defP.name,
            periodNumber: defP.periodNumber,
            status: defP.status,
          };
        }
      });

      // Ordenar cronológicamente
      currentList.sort((a, b) => a.startDate.localeCompare(b.startDate));
      localStorage.setItem('importrivero_periods_v5', JSON.stringify(currentList));
      return currentList;
    } catch (e) {
      return DEFAULT_AUTO_PERIODS;
    }
  });

  // Registros de Nómina
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_records_v5');
      if (saved) {
        const parsed: PayrollRecord[] = JSON.parse(saved);
        // Asegurar que Semana 1 esté marcada como PAGADA ("la semana 1 se les pago ya")
        return parsed.map((r) => {
          if (r.periodId === 'per-sem-1-sept-2026') {
            return {
              ...r,
              status: 'PAID',
              paymentDate: r.paymentDate || '2026-09-06',
              paymentMethod: r.paymentMethod || 'EFECTIVO',
            };
          }
          return r;
        });
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Asistencias & Marcajes GPS
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('importrivero_attendances_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const fetchAttendances = async (date?: string) => {
    try {
      const remote = await api.attendance.getAll(date);
      if (Array.isArray(remote)) {
        setAttendances(remote);
        localStorage.setItem('importrivero_attendances_v1', JSON.stringify(remote));
      }
    } catch (err) {
      console.warn('Error al cargar asistencias de la nube:', err);
    }
  };

  const recordAttendanceCheck = async (data: {
    dni: string;
    type?: AttendanceType;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    notes?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const res = await api.attendance.record(data);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      await fetchAttendances();
      return { success: true, message: res.message, data: res.attendance };
    } catch (err: any) {
      // Si el backend respondió con un error de negocio (400, 403, 409), no enmascarar ni guardar duplicado
      if (err.isApiError || (err.status && err.status >= 400 && err.status < 500)) {
        return { success: false, message: err.message || 'Operación rechazada por el servidor' };
      }

      // Si se encuentra sin conexión a internet (Modo Offline), aplicar la misma regla anti-duplicados
      const emp = employees.find((e) => e.dni === data.dni);
      if (emp) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const workerAttendancesToday = attendances
          .filter((a) => a.employeeId === emp.id && new Date(a.timestamp) >= startOfToday)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const latestToday = workerAttendancesToday[0];
        const requestedType = data.type || 'CHECK_IN';

        if (requestedType === 'CHECK_IN') {
          if (latestToday && latestToday.type === 'CHECK_IN') {
            const timeStr = new Date(latestToday.timestamp).toLocaleTimeString('es-BO', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              success: false,
              message: `Ya registraste tu ENTRADA hoy a las ${timeStr}. Tu siguiente marcaje debe ser tu SALIDA.`,
            };
          }
          if (latestToday && latestToday.type === 'CHECK_OUT') {
            const timeStr = new Date(latestToday.timestamp).toLocaleTimeString('es-BO', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              success: false,
              message: `Ya registraste tu SALIDA hoy a las ${timeStr}. Tu jornada de hoy ya está concluida.`,
            };
          }
        } else if (requestedType === 'CHECK_OUT') {
          if (!latestToday) {
            return {
              success: false,
              message: 'No puedes marcar SALIDA sin haber registrado previamente tu ENTRADA hoy.',
            };
          }
          if (latestToday.type === 'CHECK_OUT') {
            const timeStr = new Date(latestToday.timestamp).toLocaleTimeString('es-BO', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return {
              success: false,
              message: `Ya registraste tu SALIDA hoy a las ${timeStr}. Tu jornada ya fue completada.`,
            };
          }
        }

        const localAtt: AttendanceRecord = {
          id: `att-${Date.now()}`,
          employeeId: emp.id,
          employee: emp,
          type: requestedType,
          timestamp: new Date().toISOString(),
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          notes: data.notes,
        };
        setAttendances((prev) => [localAtt, ...prev]);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        return {
          success: true,
          message:
            requestedType === 'CHECK_IN'
              ? '¡Entrada registrada con éxito! (Modo local)'
              : '¡Salida registrada con éxito! (Modo local)',
          data: localAtt,
        };
      }
      return { success: false, message: err.message || 'Error al registrar marcaje' };
    }
  };

  // Sincronización completa con el Backend en PostgreSQL (Render)
  const syncWithBackend = async () => {
    try {
      setBackendStatus('connecting');
      const isAlive = await api.health();
      if (!isAlive) {
        setBackendStatus('offline');
        return;
      }

      // Asegurar token de autenticación JWT para peticiones protegidas
      if (!getAuthToken()) {
        try {
          const authRes = await api.auth.login('betito01.hra@gmail.com', '20202020');
          if (authRes && authRes.token) {
            setAuthToken(authRes.token);
          }
        } catch (e) {
          console.warn('Auto-login JWT falló:', e);
        }
      }

      // 1. Empleados desde la base de datos
      try {
        const remoteEmps = await api.employees.getAll();
        if (Array.isArray(remoteEmps) && remoteEmps.length > 0) {
          const mappedEmps: Employee[] = deduplicateEmployees(remoteEmps.map((e: any) => ({
            id: e.id,
            dni: e.dni,
            firstName: e.firstName,
            lastName: e.lastName,
            email: e.email || undefined,
            phone: e.phone || undefined,
            department: e.department,
            position: e.position,
            hireDate: e.hireDate ? String(e.hireDate).split('T')[0] : '2026-09-01',
            status: e.status || 'ACTIVE',
            paymentFrequency: e.paymentFrequency || 'SEMANAL',
            workSchedule: e.workSchedule || 'LUNES_A_SABADO',
            baseSalary: Number(e.baseSalary),
            bankName: e.bankName || undefined,
            bankAccountNumber: e.bankAccountNumber || undefined,
            qrImageUrl: e.qrImageUrl || undefined,
            expectedCheckInTime: e.expectedCheckInTime || '08:00',
            notes: e.notes || undefined,
            createdAt: e.createdAt ? String(e.createdAt).split('T')[0] : undefined,
          })));
          setEmployees(mappedEmps);
          localStorage.setItem('importrivero_employees_v5', JSON.stringify(mappedEmps));
        }
      } catch (err) {
        console.warn('No se pudieron obtener empleados de la nube:', err);
      }

      // 2. Adelantos desde la base de datos
      try {
        const remoteAdvs = await api.advances.getAll();
        if (Array.isArray(remoteAdvs)) {
          const mappedAdvs: Advance[] = remoteAdvs.map((a: any) => ({
            id: a.id,
            employeeId: a.employeeId,
            employeeName: a.employeeName || (a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : ''),
            employeeDni: a.employeeDni || a.employee?.dni || '',
            amount: Number(a.amount),
            reason: a.reason,
            requestDate: a.requestDate ? String(a.requestDate).split('T')[0] : '',
            deductedDate: a.deductedDate ? String(a.deductedDate).split('T')[0] : undefined,
            status: a.status,
            payrollRecordId: a.payrollRecordId || undefined,
            paymentMethod: a.paymentMethod || undefined,
            notes: a.notes || undefined,
          }));
          setAdvances(mappedAdvs);
          localStorage.setItem('importrivero_advances_v5', JSON.stringify(mappedAdvs));
        }
      } catch (err) {
        console.warn('No se pudieron obtener adelantos de la nube:', err);
      }

      // 3. Periodos desde la base de datos
      try {
        const remotePeriods = await api.periods.getAll();
        if (Array.isArray(remotePeriods) && remotePeriods.length > 0) {
          const mappedPeriods: PayrollPeriod[] = remotePeriods.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            frequency: p.frequency,
            startDate: String(p.startDate).split('T')[0],
            endDate: String(p.endDate).split('T')[0],
            year: p.year,
            periodNumber: p.periodNumber,
            status: p.status,
            totalGross: Number(p.totalGross || 0),
            totalNet: Number(p.totalNet || 0),
            totalAdvances: Number(p.totalAdvances || 0),
          }));
          setPeriods(mappedPeriods);
          localStorage.setItem('importrivero_periods_v5', JSON.stringify(mappedPeriods));
        }
      } catch (err) {
        console.warn('No se pudieron obtener periodos de la nube:', err);
      }

      setBackendStatus('connected');
    } catch (e) {
      console.warn('Fallo en sincronización con backend:', e);
      setBackendStatus('offline');
    }
  };

  // Al cargar la app, comprobar salud del backend y sincronizar
  useEffect(() => {
    syncWithBackend();
  }, []);

  // Sincronización AUTOMÁTICA de trabajadores con periodos abiertos (SIN DUPLICADOS)
  useEffect(() => {
    setPayrollRecords((prevRecords) => {
      const uniqueEmployees = deduplicateEmployees(employees);

      // 1. Limpiar duplicados previos de prevRecords por (periodId + employee.dni)
      // Y purgar automáticamente registros borradores si el empleado cambió de modalidad (ej. SEMANAL a MENSUAL)
      const cleanPrev: PayrollRecord[] = [];
      const seenKeys = new Set<string>();

      prevRecords.forEach((r) => {
        const currentEmp = uniqueEmployees.find(
          (e) => e.id === r.employeeId || (r.employee?.dni && e.dni === r.employee.dni)
        );
        const periodObj = periods.find((p) => p.id === r.periodId);

        // Si el empleado fue cambiado de modalidad y el registro aún está en BORRADOR (no pagado),
        // se remueve inmediatamente de este periodo para que no figure en la nómina incorrecta
        if (currentEmp && periodObj && r.status !== 'PAID') {
          if (periodObj.frequency === 'SEMANAL' && currentEmp.paymentFrequency !== 'SEMANAL') {
            return; // Omitir registro semanal de empleado mensual
          }
          if (periodObj.frequency === 'MENSUAL' && currentEmp.paymentFrequency !== 'MENSUAL') {
            return; // Omitir registro mensual de empleado semanal
          }
        }

        const dni = r.employee?.dni || r.employeeId;
        const key = `${r.periodId}__${dni}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          cleanPrev.push(r);
        }
      });

      let updatedRecords = [...cleanPrev];

      periods.forEach((targetPeriod) => {
        const isWeeklyPeriod = targetPeriod.frequency === 'SEMANAL';
        const matchingEmployees = uniqueEmployees.filter((emp) =>
          isWeeklyPeriod ? emp.paymentFrequency === 'SEMANAL' : emp.paymentFrequency === 'MENSUAL'
        );

        matchingEmployees.forEach((emp) => {
          const isWeekly = emp.paymentFrequency === 'SEMANAL';
          const isLunASab = emp.workSchedule === 'LUNES_A_SABADO' || (!emp.workSchedule && isWeekly);
          const standardDays = isWeekly ? (isLunASab ? 6 : 5) : (isLunASab ? 24 : 20);

          // Buscar registro existente por ID o por DNI dentro de targetPeriod
          const existingRecord = updatedRecords.find(
            (r) => r.periodId === targetPeriod.id && (r.employeeId === emp.id || r.employee?.dni === emp.dni)
          );

          // Solo deducir adelantos pendientes en la semana en curso (OPEN) o si el registro ya los dedujo
          const isTargetOpen = targetPeriod.status === 'OPEN';
          const pendingAdvances = isTargetOpen
            ? advances.filter(
                (a) => (a.employeeId === emp.id || a.employeeDni === emp.dni) && a.status === 'PENDING'
              )
            : [];
          const advancesSum = pendingAdvances.reduce((acc, a) => acc + Number(a.amount), 0);

          const isSemana1 = targetPeriod.id === 'per-sem-1-sept-2026';

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
              status: isSemana1 ? 'PAID' : 'DRAFT',
              paymentDate: isSemana1 ? '2026-09-06' : undefined,
              paymentMethod: isSemana1 ? 'EFECTIVO' : 'QR_BANCARIO',
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
              if (rec.id === existingRecord.id) {
                // Si es Semana 1, asegurar que figure como pagada
                if (isSemana1 && rec.status !== 'PAID') {
                  return {
                    ...rec,
                    status: 'PAID',
                    paymentDate: rec.paymentDate || '2026-09-06',
                    paymentMethod: rec.paymentMethod || 'EFECTIVO',
                  };
                }

                if (rec.status === 'DRAFT') {
                  const dailyRate = emp.baseSalary / standardDays;
                  const earnedBase = Number((dailyRate * rec.workedDays).toFixed(2));
                  const totalEarnings = earnedBase + Number(rec.overtimeAmount) + Number(rec.bonusesAmount);
                  const totalDeductions = advancesSum + Number(rec.otherDeductions);
                  const netAmount = Math.max(0, totalEarnings - totalDeductions);

                  return {
                    ...rec,
                    employeeId: emp.id,
                    employee: emp,
                    baseSalary: emp.baseSalary,
                    advancesDeduction: advancesSum,
                    totalEarnings,
                    totalDeductions,
                    netAmount,
                  };
                }
              }
              return rec;
            });
          }
        });
      });

      // Deduplicación final estricta por (periodId + DNI)
      const finalRecords: PayrollRecord[] = [];
      const finalSeen = new Set<string>();
      updatedRecords.forEach((r) => {
        const dni = r.employee?.dni || r.employeeId;
        const key = `${r.periodId}__${dni}`;
        if (!finalSeen.has(key)) {
          finalSeen.add(key);
          finalRecords.push(r);
        }
      });

      localStorage.setItem('importrivero_records_v5', JSON.stringify(finalRecords));
      return finalRecords;
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
  const addEmployee = async (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const tempId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...empData,
      id: tempId,
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

    try {
      const created = await api.employees.create(empData);
      if (created && created.id) {
        setEmployees((prev) => {
          const updated = prev.map((e) => (e.id === tempId ? { ...newEmp, id: created.id } : e));
          localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
          return updated;
        });
        setBackendStatus('connected');
      }
    } catch (err) {
      console.warn('Empleado guardado localmente, backend no disponible:', err);
    }
  };

  const updateEmployee = async (id: string, updatedData: Partial<Employee>) => {
    setEmployees((prev) => {
      const updated = prev.map((emp) => (emp.id === id ? { ...emp, ...updatedData } : emp));
      localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
      return updated;
    });

    // Si cambió de frecuencia (ej. de SEMANAL a MENSUAL), limpiar borradores no pagados del tipo anterior
    if (updatedData.paymentFrequency) {
      setPayrollRecords((prev) => {
        const updated = prev.filter((r) => {
          if (r.employeeId !== id && r.employee?.dni !== updatedData.dni) return true;
          if (r.status === 'PAID') return true; // Respetar pagos históricos
          const targetP = periods.find((p) => p.id === r.periodId);
          if (!targetP) return true;
          if (updatedData.paymentFrequency === 'MENSUAL' && targetP.frequency === 'SEMANAL') {
            return false; // Quitar de nómina semanal
          }
          if (updatedData.paymentFrequency === 'SEMANAL' && targetP.frequency === 'MENSUAL') {
            return false; // Quitar de nómina mensual
          }
          return true;
        });
        localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
        return updated;
      });
    }

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });

    try {
      const res = await api.employees.update(id, updatedData);
      if (res && res.id) {
        setEmployees((prev) => {
          const updated = prev.map((emp) => (emp.id === id ? { ...emp, ...res, id: res.id } : emp));
          localStorage.setItem('importrivero_employees_v5', JSON.stringify(updated));
          return updated;
        });
        setBackendStatus('connected');
      }
    } catch (err) {
      console.warn('Actualización de empleado guardada localmente:', err);
    }
  };

  const deleteEmployee = async (id: string) => {
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

    try {
      await api.employees.delete(id);
    } catch (err) {
      console.warn('Eliminación de empleado procesada localmente:', err);
    }
  };

  // Acciones de Adelantos
  const addAdvance = async (advData: {
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
    const tempId = `adv-${Date.now()}`;
    const newAdv: Advance = {
      id: tempId,
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

    try {
      const created = await api.advances.create(advData);
      if (created && created.id) {
        setAdvances((prev) => {
          const updated = prev.map((a) => (a.id === tempId ? { ...newAdv, id: created.id } : a));
          localStorage.setItem('importrivero_advances_v5', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn('Adelanto guardado localmente:', err);
    }
  };

  const deleteAdvance = async (id: string) => {
    setAdvances((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem('importrivero_advances_v5', JSON.stringify(updated));
      return updated;
    });

    try {
      await api.advances.delete(id);
    } catch (err) {
      console.warn('Eliminación de adelanto procesada localmente:', err);
    }
  };

  // Acciones de Periodos
  const addPeriod = async (periodData: Omit<PayrollPeriod, 'id' | 'status' | 'totalGross' | 'totalNet' | 'totalAdvances'>) => {
    const tempId = `per-${Date.now()}`;
    const newPeriod: PayrollPeriod = {
      ...periodData,
      id: tempId,
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

    try {
      const created = await api.periods.create(periodData);
      if (created && created.id) {
        setPeriods((prev) => {
          const updated = prev.map((p) => (p.id === tempId ? { ...newPeriod, id: created.id } : p));
          localStorage.setItem('importrivero_periods_v5', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn('Periodo guardado localmente:', err);
    }

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

  const markRecordAsPaid = (
    recordId: string,
    method: PaymentMethod,
    paymentDate?: string,
    paymentReference?: string,
    paymentNotes?: string
  ) => {
    const finalDate = paymentDate || new Date().toISOString().split('T')[0];
    setPayrollRecords((prev) => {
      const updated: PayrollRecord[] = prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              status: 'PAID' as const,
              paymentMethod: method,
              paymentDate: finalDate,
              paymentReference: paymentReference?.trim() || undefined,
              paymentNotes: paymentNotes?.trim() || undefined,
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

  const markRecordAsUnpaid = (recordId: string) => {
    setPayrollRecords((prev) => {
      const updated: PayrollRecord[] = prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              status: 'DRAFT' as const,
              paymentMethod: undefined,
              paymentDate: undefined,
              paymentReference: undefined,
              paymentNotes: undefined,
            }
          : rec
      );
      localStorage.setItem('importrivero_records_v5', JSON.stringify(updated));
      return updated;
    });
  };

  const approveAndClosePeriod = (periodId: string) => {
    // IMPORTANTE: Al cerrar la semana/periodo, NO forzar 'PAID' a todos.
    // Solo aquellos trabajadores a quienes se les registró su pago individual tienen 'PAID'.
    // Los no pagados permanecen como 'DRAFT' para que el sistema emita alertas de deuda pendiente.

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
        isPrivacyMode,
        togglePrivacyMode,
        formatMoney,
        inactivityCountdown,
        resetInactivityTimer,
        changeUserPassword,
        backendStatus,
        backendUrl,
        setBackendUrl,
        syncWithBackend,
        employees,
        advances,
        periods,
        payrollRecords,
        attendances,
        fetchAttendances,
        recordAttendanceCheck,
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
        markRecordAsUnpaid,
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
