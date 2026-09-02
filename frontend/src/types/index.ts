export type UserRole = 'SUPERADMIN' | 'ADMINISTRADOR' | 'OFICINA' | 'VENTAS' | 'LOGISTICA';

export type PaymentFrequency = 'SEMANAL' | 'MENSUAL' | 'QUINCENAL';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type AdvanceStatus = 'PENDING' | 'APPROVED' | 'DEDUCTED' | 'CANCELLED';

export type PeriodStatus = 'OPEN' | 'PROCESSING' | 'CLOSED';

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

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
  baseSalary: number; // Salario semanal o mensual
  bankName?: string;
  bankAccountNumber?: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeDni?: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: AdvanceStatus;
  notes?: string;
  deductedInPeriodId?: string;
}

export interface PayrollItem {
  id: string;
  type: 'EARNING' | 'DEDUCTION';
  name: string;
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
  totalEarnings: number;
  advancesDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netAmount: number;
  status: PayrollStatus;
  paidAt?: string;
  paymentReference?: string;
  items: PayrollItem[];
}

export interface PayrollPeriod {
  id: string;
  code: string; // Ej: SEM-2026-W35 o MES-2026-08
  name: string;
  frequency: PaymentFrequency;
  startDate: string;
  endDate: string;
  year: number;
  periodNumber: number;
  status: PeriodStatus;
  totalPaid?: number;
}
