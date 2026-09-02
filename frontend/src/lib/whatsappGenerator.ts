import { PayrollRecord, PayrollPeriod } from '../types';

export const generateWhatsAppMessage = (
  record: PayrollRecord,
  period: PayrollPeriod,
  currencySymbol = 'Bs'
): string => {
  const emp = record.employee;
  const isWeekly = emp.paymentFrequency === 'SEMANAL';
  const scheduleLabel =
    emp.workSchedule === 'LUNES_A_VIERNES'
      ? 'Lunes a Viernes (5d)'
      : 'Lunes a Sábado (6d)';

  const lines = [
    `🏢 *IMPORTADORA RIVERO S.R.L.*`,
    `📄 *BOLETA & COMPROBANTE DE PAGO DE SALARIO*`,
    ``,
    `👤 *Trabajador:* ${emp.lastName}, ${emp.firstName}`,
    `🆔 *C.I. / DNI:* ${emp.dni}`,
    `💼 *Cargo:* ${emp.position} (${emp.department})`,
    `📅 *Periodo Liquidado:* ${period.name}`,
    `📆 *Jornada Laboral:* ${scheduleLabel}`,
    `⏱️ *Días Trabajados:* ${record.workedDays} días`,
    ``,
    `───────────────────────`,
    `💵 *Sueldo Base:* ${currencySymbol} ${Number(record.baseSalary).toFixed(2)}`,
    ...(record.overtimeAmount > 0
      ? [`➕ *Horas Extras (${record.overtimeHours}h):* +${currencySymbol} ${Number(record.overtimeAmount).toFixed(2)}`]
      : []),
    ...(record.bonusesAmount > 0
      ? [`➕ *Bonos / Comisiones:* +${currencySymbol} ${Number(record.bonusesAmount).toFixed(2)}`]
      : []),
    ...(record.advancesDeduction > 0
      ? [`➖ *Adelantos Deducidos:* -${currencySymbol} ${Number(record.advancesDeduction).toFixed(2)}`]
      : []),
    ...(record.otherDeductions > 0
      ? [`➖ *Otras Deducciones:* -${currencySymbol} ${Number(record.otherDeductions).toFixed(2)}`]
      : []),
    `───────────────────────`,
    `💰 *LÍQUIDO PAGABLE NETO:* *${currencySymbol} ${Number(record.netAmount).toFixed(2)}*`,
    `💳 *Modalidad de Cobro:* ${record.paymentMethod === 'QR_BANCARIO' ? 'QR Simple Bancario' : record.paymentMethod === 'EFECTIVO' ? 'Efectivo en Caja' : 'Transferencia'}`,
    `───────────────────────`,
    ``,
    `✅ *Pago procesado y verificado por la Administración de Importadora Rivero S.R.L.*`,
  ];

  return lines.join('\n');
};

export const sendPayslipViaWhatsApp = (
  record: PayrollRecord,
  period: PayrollPeriod,
  currencySymbol = 'Bs'
) => {
  const phone = record.employee.phone || '';
  // Limpiar caracteres no numéricos
  let cleanPhone = phone.replace(/\D/g, '');

  if (!cleanPhone) {
    const promptPhone = prompt(
      `El trabajador ${record.employee.firstName} ${record.employee.lastName} no tiene teléfono guardado. Ingresa su número de WhatsApp:`,
      '69434357'
    );
    if (!promptPhone) return;
    cleanPhone = promptPhone.replace(/\D/g, '');
  }

  // Si no tiene código de país, agregar +591 (Bolivia)
  if (cleanPhone.length === 8) {
    cleanPhone = `591${cleanPhone}`;
  }

  const message = generateWhatsAppMessage(record, period, currencySymbol);
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  window.open(waUrl, '_blank');
};
