export interface PayrollCalculationInput {
  baseSalary: number;
  frequency: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL';
  workedDays?: number; // 7 para semanal por defecto, 30 para mensual
  overtimeHours?: number;
  bonuses?: { name: string; amount: number }[];
  otherDeductions?: { name: string; amount: number }[];
  advances?: { id: string; amount: number; reason: string }[];
}

export interface PayrollCalculationResult {
  baseSalary: number;
  workedDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  bonusesAmount: number;
  totalEarnings: number;
  advancesDeduction: number;
  otherDeductionsAmount: number;
  totalDeductions: number;
  netAmount: number;
  items: {
    type: 'EARNING' | 'DEDUCTION';
    name: string;
    amount: number;
  }[];
}

export class PayrollService {
  /**
   * Calcula la liquidación de un empleado considerando frecuencia semanal o mensual
   */
  static calculate(input: PayrollCalculationInput): PayrollCalculationResult {
    const isWeekly = input.frequency === 'SEMANAL';
    const standardDays = isWeekly ? 7 : 30;
    const workedDays = input.workedDays ?? standardDays;

    // Proporcional si faltó días (base)
    const dailyRate = input.baseSalary / standardDays;
    const earnedBaseSalary = Number((dailyRate * workedDays).toFixed(2));

    // Valor hora extra (estimado: 48h semana para semanal, 240h mes para mensual) x 1.5
    const regularHours = isWeekly ? 48 : 240;
    const hourlyRate = input.baseSalary / regularHours;
    const overtimeHours = input.overtimeHours || 0;
    const overtimeAmount = Number((overtimeHours * hourlyRate * 1.5).toFixed(2));

    // Suma de bonos
    const bonuses = input.bonuses || [];
    const bonusesAmount = Number(bonuses.reduce((acc, b) => acc + (Number(b.amount) || 0), 0).toFixed(2));

    const totalEarnings = Number((earnedBaseSalary + overtimeAmount + bonusesAmount).toFixed(2));

    // Adelantos
    const advances = input.advances || [];
    const advancesDeduction = Number(advances.reduce((acc, a) => acc + (Number(a.amount) || 0), 0).toFixed(2));

    // Otras deducciones (seguros, faltas, etc.)
    const otherDeductions = input.otherDeductions || [];
    const otherDeductionsAmount = Number(otherDeductions.reduce((acc, d) => acc + (Number(d.amount) || 0), 0).toFixed(2));

    const totalDeductions = Number((advancesDeduction + otherDeductionsAmount).toFixed(2));

    // Neto a pagar
    const netAmount = Number(Math.max(0, totalEarnings - totalDeductions).toFixed(2));

    // Desglose de ítems para el recibo/boleta
    const items: { type: 'EARNING' | 'DEDUCTION'; name: string; amount: number }[] = [
      {
        type: 'EARNING',
        name: `Sueldo Base (${workedDays}/${standardDays} días)`,
        amount: earnedBaseSalary,
      },
    ];

    if (overtimeAmount > 0) {
      items.push({
        type: 'EARNING',
        name: `Horas Extras (${overtimeHours} hrs @ 150%)`,
        amount: overtimeAmount,
      });
    }

    bonuses.forEach((b) => {
      if (b.amount > 0) {
        items.push({
          type: 'EARNING',
          name: b.name || 'Bono adicional',
          amount: Number(b.amount),
        });
      }
    });

    advances.forEach((a) => {
      if (a.amount > 0) {
        items.push({
          type: 'DEDUCTION',
          name: `Descuento Adelanto: ${a.reason || 'Anticipo'}`,
          amount: Number(a.amount),
        });
      }
    });

    otherDeductions.forEach((d) => {
      if (d.amount > 0) {
        items.push({
          type: 'DEDUCTION',
          name: d.name || 'Deducción general',
          amount: Number(d.amount),
        });
      }
    });

    return {
      baseSalary: input.baseSalary,
      workedDays,
      overtimeHours,
      overtimeAmount,
      bonusesAmount,
      totalEarnings,
      advancesDeduction,
      otherDeductionsAmount,
      totalDeductions,
      netAmount,
      items,
    };
  }
}
