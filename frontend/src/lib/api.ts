// Cliente API centralizado para sincronización con Backend en Render / PostgreSQL

export const DEFAULT_BACKEND_URL =
  ((import.meta as any).env?.VITE_API_URL as string) ||
  'https://siscontrol-backend.onrender.com/api';

export const getBackendBaseUrl = (): string => {
  const customUrl = localStorage.getItem('importrivero_backend_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BACKEND_URL.replace(/\/+$/, '');
};

export const setBackendBaseUrl = (url: string): void => {
  if (!url || !url.trim()) {
    localStorage.removeItem('importrivero_backend_url');
  } else {
    localStorage.setItem('importrivero_backend_url', url.trim().replace(/\/+$/, ''));
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('importrivero_jwt_token');
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('importrivero_jwt_token', token);
  } else {
    localStorage.removeItem('importrivero_jwt_token');
  }
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Ignorar si no es JSON
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
};

export const api = {
  // Comprobación de salud del backend
  health: async (): Promise<boolean> => {
    try {
      const baseUrl = getBackendBaseUrl();
      const rootUrl = baseUrl.replace(/\/api\/?$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${rootUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Autenticación
  auth: {
    login: async (email: string, pass: string) => {
      return request<{
        token: string;
        user: {
          id: string;
          name: string;
          email: string;
          role: string;
          employeeId?: string;
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
    },
    getProfile: async () => {
      return request<{
        id: string;
        name: string;
        email: string;
        role: string;
        employee?: any;
      }>('/auth/profile');
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      return request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },

  // Empleados
  employees: {
    getAll: async () => {
      return request<any[]>('/employees');
    },
    getById: async (id: string) => {
      return request<any>(`/employees/${id}`);
    },
    create: async (data: any) => {
      return request<any>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return request<any>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/employees/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Adelantos
  advances: {
    getAll: async () => {
      return request<any[]>('/advances');
    },
    create: async (data: any) => {
      return request<any>('/advances', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStatus: async (id: string, status: string) => {
      return request<any>(`/advances/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    delete: async (id: string) => {
      return request<{ message: string }>(`/advances/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Periodos y Nómina
  periods: {
    getAll: async () => {
      return request<any[]>('/payrolls/periods');
    },
    create: async (data: any) => {
      return request<any>('/payrolls/periods', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    generatePayroll: async (periodId: string) => {
      return request<any[]>(`/payrolls/periods/${periodId}/generate`, {
        method: 'POST',
      });
    },
    getRecords: async (periodId: string) => {
      return request<any[]>(`/payrolls/periods/${periodId}/records`);
    },
    updateRecord: async (recordId: string, data: any) => {
      return request<any>(`/payrolls/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    payPeriod: async (periodId: string) => {
      return request<any>(`/payrolls/periods/${periodId}/pay`, {
        method: 'POST',
      });
    },
  },

  // Control de Asistencias & GPS
  attendance: {
    verifyWorker: async (dni: string) => {
      return request<{
        employee: any;
        latestAttendanceToday?: any;
        suggestedNextType: 'CHECK_IN' | 'CHECK_OUT';
      }>(`/attendance/worker/${encodeURIComponent(dni)}`);
    },
    record: async (data: {
      dni: string;
      type?: 'CHECK_IN' | 'CHECK_OUT';
      latitude?: number | null;
      longitude?: number | null;
      accuracy?: number | null;
      deviceInfo?: string;
      notes?: string;
    }) => {
      return request<{
        message: string;
        attendance: any;
      }>('/attendance/check', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getAll: async (date?: string, employeeId?: string) => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (employeeId) params.append('employeeId', employeeId);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<any[]>(`/attendance${query}`);
    },
    getTodaySummary: async () => {
      return request<{
        totalEmployees: number;
        presentNow: number;
        finishedDay: number;
        absentToday: number;
        totalCheckedInToday: number;
        records: any[];
      }>('/attendance/today-summary');
    },
  },

  // Portal de Consulta para Trabajadores (C.I. + PIN de Seguridad)
  worker: {
    checkPinStatus: async (dni: string) => {
      return request<{
        employee: any;
        hasPin: boolean;
      }>(`/worker/pin-status/${encodeURIComponent(dni)}`);
    },
    setPin: async (dni: string, pin: string) => {
      return request<{ message: string }>('/worker/set-pin', {
        method: 'POST',
        body: JSON.stringify({ dni, pin }),
      });
    },
    getPortalData: async (dni: string, pin: string) => {
      return request<{
        employee: any;
        payrollRecords: any[];
        advances: any[];
        attendances: any[];
      }>('/worker/portal-data', {
        method: 'POST',
        body: JSON.stringify({ dni, pin }),
      });
    },
  },
};
