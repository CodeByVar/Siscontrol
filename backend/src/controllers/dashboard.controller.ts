import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const weeklyEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE', paymentFrequency: 'SEMANAL' },
    });
    const monthlyEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE', paymentFrequency: 'MENSUAL' },
    });

    // Suma de salarios base semanales proyectados
    const weeklyEmployeesList = await prisma.employee.findMany({
      where: { status: 'ACTIVE', paymentFrequency: 'SEMANAL' },
      select: { baseSalary: true },
    });
    const weeklyPayrollBase = weeklyEmployeesList.reduce((acc, e) => acc + Number(e.baseSalary), 0);

    // Suma de salarios base mensuales proyectados
    const monthlyEmployeesList = await prisma.employee.findMany({
      where: { status: 'ACTIVE', paymentFrequency: 'MENSUAL' },
      select: { baseSalary: true },
    });
    const monthlyPayrollBase = monthlyEmployeesList.reduce((acc, e) => acc + Number(e.baseSalary), 0);

    // Total adelantos pendientes
    const pendingAdvances = await prisma.advance.findMany({
      where: { status: 'PENDING' },
      select: { amount: true },
    });
    const totalPendingAdvances = pendingAdvances.reduce((acc, a) => acc + Number(a.amount), 0);

    // Distribución de empleados por departamento
    const departmentDistribution = await prisma.employee.groupBy({
      by: ['department'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
      _sum: { baseSalary: true },
    });

    // Últimos periodos de pago
    const recentPeriods = await prisma.payrollPeriod.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { records: true } },
      },
    });

    return res.json({
      totalEmployees,
      weeklyEmployees,
      monthlyEmployees,
      weeklyPayrollBase: Number(weeklyPayrollBase.toFixed(2)),
      monthlyPayrollBase: Number(monthlyPayrollBase.toFixed(2)),
      totalPendingAdvances: Number(totalPendingAdvances.toFixed(2)),
      departmentDistribution,
      recentPeriods,
    });
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    return res.status(500).json({ error: 'Error al cargar métricas' });
  }
};
