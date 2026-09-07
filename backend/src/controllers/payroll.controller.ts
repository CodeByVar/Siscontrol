import { Request, Response } from 'express';
import { PrismaClient, PaymentFrequency } from '@prisma/client';
import { PayrollService } from '../services/payroll.service';

const prisma = new PrismaClient();

export const getPeriods = async (req: Request, res: Response) => {
  const { frequency, year } = req.query;

  try {
    const whereClause: any = {};
    if (frequency) whereClause.frequency = frequency as PaymentFrequency;
    if (year) whereClause.year = Number(year);

    const periods = await prisma.payrollPeriod.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return res.json(periods);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar periodos de pago' });
  }
};

export const createPeriod = async (req: Request, res: Response) => {
  const { code, name, frequency, startDate, endDate, year, periodNumber } = req.body;

  if (!code || !name || !frequency || !startDate || !endDate || !year || !periodNumber) {
    return res.status(400).json({ error: 'Todos los campos del periodo son obligatorios' });
  }

  try {
    const period = await prisma.payrollPeriod.create({
      data: {
        code,
        name,
        frequency,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year: Number(year),
        periodNumber: Number(periodNumber),
        status: 'OPEN',
      },
    });

    return res.status(201).json(period);
  } catch (error) {
    console.error('Error al crear periodo:', error);
    return res.status(500).json({ error: 'Error al crear periodo de nómina' });
  }
};

export const generatePayrollForPeriod = async (req: Request, res: Response) => {
  const { periodId } = req.params;

  try {
    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return res.status(404).json({ error: 'Periodo no encontrado' });
    }

    // Obtener empleados activos correspondientes a la frecuencia del periodo
    const employees = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        paymentFrequency: period.frequency,
      },
      include: {
        advances: {
          where: { status: 'PENDING' },
        },
      },
    });

    const generatedRecords = [];

    for (const emp of employees) {
      const calculation = PayrollService.calculate({
        baseSalary: Number(emp.baseSalary),
        frequency: emp.paymentFrequency,
        advances: emp.advances.map((a) => ({
          id: a.id,
          amount: Number(a.amount),
          reason: a.reason,
        })),
      });

      // Upsert record
      const record = await prisma.payrollRecord.upsert({
        where: {
          periodId_employeeId: {
            periodId: period.id,
            employeeId: emp.id,
          },
        },
        update: {
          baseSalary: calculation.baseSalary,
          workedDays: calculation.workedDays,
          overtimeHours: calculation.overtimeHours,
          overtimeAmount: calculation.overtimeAmount,
          bonusesAmount: calculation.bonusesAmount,
          totalEarnings: calculation.totalEarnings,
          advancesDeduction: calculation.advancesDeduction,
          otherDeductions: calculation.otherDeductionsAmount,
          totalDeductions: calculation.totalDeductions,
          netAmount: calculation.netAmount,
        },
        create: {
          periodId: period.id,
          employeeId: emp.id,
          baseSalary: calculation.baseSalary,
          workedDays: calculation.workedDays,
          overtimeHours: calculation.overtimeHours,
          overtimeAmount: calculation.overtimeAmount,
          bonusesAmount: calculation.bonusesAmount,
          totalEarnings: calculation.totalEarnings,
          advancesDeduction: calculation.advancesDeduction,
          otherDeductions: calculation.otherDeductionsAmount,
          totalDeductions: calculation.totalDeductions,
          netAmount: calculation.netAmount,
          status: 'DRAFT',
        },
      });

      // Reemplazar items
      await prisma.payrollItem.deleteMany({
        where: { payrollRecordId: record.id },
      });

      for (const item of calculation.items) {
        await prisma.payrollItem.create({
          data: {
            payrollRecordId: record.id,
            type: item.type,
            name: item.name,
            amount: item.amount,
          },
        });
      }

      generatedRecords.push(record);
    }

    // Actualizar estado del periodo a PROCESSING
    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'PROCESSING' },
    });

    return res.json({
      message: `Nómina generada exitosamente para ${generatedRecords.length} empleados`,
      count: generatedRecords.length,
    });
  } catch (error) {
    console.error('Error al generar nómina:', error);
    return res.status(500).json({ error: 'Error al procesar nómina' });
  }
};

export const getPayrollRecordsByPeriod = async (req: Request, res: Response) => {
  const { periodId } = req.params;

  try {
    const records = await prisma.payrollRecord.findMany({
      where: { periodId },
      include: {
        employee: true,
        items: true,
      },
      orderBy: {
        employee: { lastName: 'asc' },
      },
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener registros de nómina' });
  }
};

export const updatePayrollRecord = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { workedDays, overtimeHours, bonuses, otherDeductions, status, paymentDate, paymentReference } = req.body;

  try {
    const current = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            advances: { where: { status: 'PENDING' } },
          },
        },
        period: true,
      },
    });

    if (!current) {
      return res.status(404).json({ error: 'Registro de nómina no encontrado' });
    }

    // Recalcular
    const calculation = PayrollService.calculate({
      baseSalary: Number(current.employee.baseSalary),
      frequency: current.employee.paymentFrequency,
      workedDays: workedDays !== undefined ? Number(workedDays) : current.workedDays,
      overtimeHours: overtimeHours !== undefined ? Number(overtimeHours) : Number(current.overtimeHours),
      bonuses: bonuses || [],
      otherDeductions: otherDeductions || [],
      advances: current.employee.advances.map((a) => ({
        id: a.id,
        amount: Number(a.amount),
        reason: a.reason,
      })),
    });

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        workedDays: calculation.workedDays,
        overtimeHours: calculation.overtimeHours,
        overtimeAmount: calculation.overtimeAmount,
        bonusesAmount: calculation.bonusesAmount,
        totalEarnings: calculation.totalEarnings,
        advancesDeduction: calculation.advancesDeduction,
        otherDeductions: calculation.otherDeductionsAmount,
        totalDeductions: calculation.totalDeductions,
        netAmount: calculation.netAmount,
        status: status || current.status,
        ...(status === 'PAID'
          ? {
              paidAt: paymentDate ? new Date(paymentDate) : new Date(),
              paymentReference: paymentReference || current.paymentReference,
            }
          : status === 'DRAFT'
          ? { paidAt: null, paymentReference: null }
          : {}),
      },
      include: {
        employee: true,
        items: true,
      },
    });

    // Si se marcó como pagado individualmente y tiene adelanto, actualizar estado del adelanto a DEDUCTED
    if (status === 'PAID' && Number(calculation.advancesDeduction) > 0) {
      await prisma.advance.updateMany({
        where: {
          employeeId: current.employeeId,
          status: 'PENDING',
        },
        data: {
          status: 'DEDUCTED',
          payrollRecordId: id,
        },
      });
    }

    // Actualizar items si se pasaron nuevos
    if (bonuses || otherDeductions || overtimeHours !== undefined || workedDays !== undefined) {
      await prisma.payrollItem.deleteMany({ where: { payrollRecordId: id } });
      for (const item of calculation.items) {
        await prisma.payrollItem.create({
          data: {
            payrollRecordId: id,
            type: item.type,
            name: item.name,
            amount: item.amount,
          },
        });
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error al actualizar registro:', error);
    return res.status(500).json({ error: 'Error al actualizar registro de nómina' });
  }
};

export const payPayrollPeriod = async (req: Request, res: Response) => {
  const { periodId } = req.params;

  try {
    // 1. Marcar los adelantos de los empleados que ya tienen status PAID
    const paidRecords = await prisma.payrollRecord.findMany({
      where: { periodId, status: 'PAID' },
      include: { employee: true },
    });

    for (const rec of paidRecords) {
      if (Number(rec.advancesDeduction) > 0) {
        await prisma.advance.updateMany({
          where: {
            employeeId: rec.employeeId,
            status: 'PENDING',
          },
          data: {
            status: 'DEDUCTED',
            payrollRecordId: rec.id,
          },
        });
      }
    }

    // 2. Cerrar periodo respetando el estado individual de pago de cada trabajador
    const updatedPeriod = await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'CLOSED' },
    });

    return res.json({ message: 'Periodo de nómina cerrado exitosamente', period: updatedPeriod });
  } catch (error) {
    console.error('Error al cerrar nómina:', error);
    return res.status(500).json({ error: 'Error al procesar el cierre de la nómina' });
  }
};
