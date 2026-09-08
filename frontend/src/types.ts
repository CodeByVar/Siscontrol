export type UserRole =
  | 'SUPERADMIN'
  | 'ADMINISTRADOR'
  | 'OFICINA'
  | 'VENTAS'
  | 'LOGISTICA';

export type PaymentFrequency = 'SEMANAL' | 'MENSUAL';

export type WorkSchedule = 'LUNES_A_SABADO' | 'LUNES_A_VIERNES' | 'LUNES_A_DOMINGO';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export type AdvanceStatus = 'PENDING' | 'DEDUCTED' | 'CANCELLED';

export type PeriodStatus = 'OPEN' | 'CALCULATING' | 'CLOSED';

export type PaymentMethod = 'QR_BANCARIO' | 'EFECTIVO' | 'TRANSFERENCIA';

export interface Employee {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department: UserRole;
  position: string;
  hireDate: string;
  status: EmployeeStatus;
  paymentFrequency: PaymentFrequency;
  workSchedule?: WorkSchedule; // Lunes a Sábado vs Lunes a Viernes
  expectedCheckInTime?: string; // Hora programada de entrada (ej: "08:00") para control de retrasos
  baseSalary: number;
  bankName?: string;
  bankAccountNumber?: string;
  qrImageUrl?: string; // Imagen o Data URL del QR Bancario
  notes?: string;
  createdAt?: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDni: string;
  amount: number;
  reason: string;
  requestDate: string;
  deductedDate?: string;
  status: AdvanceStatus;
  payrollRecordId?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PayrollPeriod {
  id: string;
  code: string;
  name: string;
  frequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  year: number;
  periodNumber: number;
  status: PeriodStatus;
  totalGross?: number;
  totalNet?: number;
  totalAdvances?: number;
  closedAt?: string;
}

export interface PayrollItem {
  id: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
}

export interface PayrollRecord {
  id: string;
  periodId: string;
  employeeId: string;
  employee: Employee;
  baseSalary: number;
  workedDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonusesAmount: number;
  advancesDeduction: number;
  otherDeductions: number;
  totalEarnings: number;
  totalDeductions: number;
  netAmount: number;
  status: 'DRAFT' | 'PAID';
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  paymentReference?: string;
  paymentNotes?: string;
  items: PayrollItem[];
}

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  type: AttendanceType;
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  deviceInfo?: string | null;
  notes?: string | null;
  createdAt?: string;
}

