import { Request, Response } from 'express';
import { PrismaClient, AdvanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const getAdvances = async (req: Request, res: Response) => {
  const { status, employeeId } = req.query;

  try {
    const whereClause: any = {};
    if (status) whereClause.status = status as AdvanceStatus;
    if (employeeId) whereClause.employeeId = String(employeeId);

    const advances = await prisma.advance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dni: true,
            department: true,
            paymentFrequency: true,
          },
        },
      },
      orderBy: { requestDate: 'desc' },
    });

    const formatted = advances.map((a) => ({
      ...a,
      amount: Number(a.amount),
      employeeName: a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : '',
      employeeDni: a.employee?.dni || '',
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Error al listar adelantos' });
  }
};

export const createAdvance = async (req: Request, res: Response) => {
  const { employeeId, amount, reason, notes, paymentMethod } = req.body;

  if (!employeeId || !amount || !reason) {
    return res.status(400).json({ error: 'Empleado, monto y motivo son obligatorios' });
  }

  try {
    const advance = await prisma.advance.create({
      data: {
        employeeId,
        amount: Number(amount),
        reason,
        notes,
        paymentMethod: paymentMethod || 'EFECTIVO',
        status: 'PENDING',
      },
      include: { employee: true },
    });

    const formatted = {
      ...advance,
      amount: Number(advance.amount),
      employeeName: advance.employee ? `${advance.employee.firstName} ${advance.employee.lastName}` : '',
      employeeDni: advance.employee?.dni || '',
    };

    return res.status(201).json(formatted);
  } catch (error) {
    console.error('Error al registrar adelanto:', error);
    return res.status(500).json({ error: 'Error al registrar adelanto' });
  }
};

export const updateAdvanceStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'El nuevo estado es requerido' });
  }

  try {
    const advance = await prisma.advance.update({
      where: { id },
      data: { status },
    });

    return res.json(advance);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar estado del adelanto' });
  }
};

export const deleteAdvance = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.advance.delete({ where: { id } });
    return res.json({ message: 'Adelanto eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar adelanto' });
  }
};
