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
    'FECHA DE PAGO': r.status === 'PAID' ? (r.paymentDate || 'Confirmado') : 'PENDIENTE',
    'MÉTODO DE PAGO': r.status === 'PAID' ? (r.paymentMethod || 'EFECTIVO') : '-',
    'REFERENCIA / COMPROBANTE': r.paymentReference || '-',
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

export const exportWeeklyMonthAuditToExcel = (
  monthLabel: string,
  totalWeeksInMonth: number,
  rows: {
    dni: string;
    fullName: string;
    position: string;
    baseWeekly: number;
    weeksData: { weekIndex: number; netAmount: number; status: string; paymentDate?: string }[];
    totalMonthGross: number;
    totalMonthPaid: number;
    totalMonthPending: number;
    paidWeeksCount: number;
  }[]
) => {
  const data = rows.map((row, index) => {
    const item: Record<string, any> = {
      'Nº': index + 1,
      'C.I. / DNI': row.dni,
      'TRABAJADOR': row.fullName,
      'CARGO': row.position,
      'SUELDO SEMANAL': row.baseWeekly,
    };

    for (let w = 1; w <= totalWeeksInMonth; w++) {
      const wData = row.weeksData.find((wd) => wd.weekIndex === w);
      item[`SEM ${w} (MONTO)`] = wData ? wData.netAmount : 0;
      item[`SEM ${w} (ESTADO)`] = wData
        ? wData.status === 'PAID'
          ? `PAGADO (${wData.paymentDate || 'OK'})`
          : 'PENDIENTE'
        : 'POR LIQUIDAR';
    }

    item['TOTAL MES PROYECTADO'] = row.totalMonthGross;
    item['TOTAL COBRADO'] = row.totalMonthPaid;
    item['SALDO PENDIENTE'] = row.totalMonthPending;
    item['SEMANAS PAGADAS'] = `${row.paidWeeksCount} de ${totalWeeksInMonth}`;

    return item;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz Semanas');

  const fileName = `Control_Semanas_${monthLabel.replace(/\s+/g, '_')}_ImportRivero.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

