import * as XLSX from 'xlsx';
import { PayrollRecord, PayrollPeriod } from '../types';

export const exportPayrollToExcel = (records: PayrollRecord[], period: PayrollPeriod) => {
  const data = records.map((r, index) => ({
    'Nº': index + 1,
    'C.I. / DNI': r.employee.dni,
    'TRABAJADOR': `${r.employee.lastName}, ${r.employee.firstName}`,
    'DEPARTAMENTO': r.employee.department,
    'CARGO': r.employee.position,
    'MODALIDAD': r.employee.paymentFrequency,
    'SUELDO BASE': Number(r.baseSalary),
    'DÍAS TRAB.': r.workedDays,
    'HRS EXTRAS': Number(r.overtimeHours),
    'MONTO H.E.': Number(r.overtimeAmount),
    'BONOS / COMISIONES': Number(r.bonusesAmount),
    'TOTAL HABERES': Number(r.totalEarnings),
    'ADELANTOS DESCONTADOS': Number(r.advancesDeduction),
    'OTROS DESCUENTOS': Number(r.otherDeductions),
    'TOTAL DESCUENTOS': Number(r.totalDeductions),
    'LÍQUIDO PAGABLE (NETO)': Number(r.netAmount),
    'ESTADO': r.status === 'PAID' ? 'PAGADO' : 'PENDIENTE',
    'BANCO': r.employee.bankName || 'EFECTIVO',
    'NRO CUENTA': r.employee.bankAccountNumber || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Liquidación');

  // Ajustar anchos de columna
  const colWidths = [
    { wch: 4 },
    { wch: 12 },
    { wch: 28 },
    { wch: 14 },
    { wch: 26 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
  ];
  worksheet['!cols'] = colWidths;

  const fileName = `Nomina_${period.code}_ImportRivero.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
