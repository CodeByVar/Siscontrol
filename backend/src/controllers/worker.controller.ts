import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Comprobar si el trabajador ya tiene un PIN creado
export const checkWorkerPinStatus = async (req: Request, res: Response) => {
  const { dni } = req.params;

  if (!dni) {
    return res.status(400).json({ error: 'Se requiere el número de C.I.' });
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        dni: String(dni).trim(),
        status: 'ACTIVE',
      },
      select: {
        id: true,
        dni: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        workerPin: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Trabajador no encontrado o inactivo' });
    }

    return res.json({
      employee: {
        id: employee.id,
        dni: employee.dni,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department,
      },
      hasPin: Boolean(employee.workerPin),
    });
  } catch (error) {
    console.error('Error al verificar estado de PIN:', error);
    return res.status(500).json({ error: 'Error del servidor al consultar trabajador' });
  }
};

// 2. Establecer el PIN por primera vez (o cambiarlo)
export const setWorkerPin = async (req: Request, res: Response) => {
  const { dni, pin } = req.body;

  if (!dni || !pin) {
    return res.status(400).json({ error: 'Se requiere el C.I. y el nuevo PIN' });
  }

  if (String(pin).length < 4) {
    return res.status(400).json({ error: 'El PIN debe tener al menos 4 caracteres' });
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        dni: String(dni).trim(),
        status: 'ACTIVE',
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const hashedPin = await bcrypt.hash(String(pin).trim(), 10);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { workerPin: hashedPin },
    });

    return res.json({
      message: 'PIN de seguridad creado con éxito. Ya puedes consultar tus estados de pago.',
    });
  } catch (error) {
    console.error('Error al guardar PIN del trabajador:', error);
    return res.status(500).json({ error: 'Error al registrar el PIN de seguridad' });
  }
};

// 3. Consultar datos salariales protegidos por PIN
export const getWorkerPortalData = async (req: Request, res: Response) => {
  const { dni, pin } = req.body;

  if (!dni || !pin) {
    return res.status(400).json({ error: 'Se requiere C.I. y PIN de seguridad' });
  }

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        dni: String(dni).trim(),
        status: 'ACTIVE',
      },
      include: {
        payrollRecords: {
          include: {
            period: true,
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 8,
        },
        advances: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        attendances: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    if (!employee.workerPin) {
      return res.status(403).json({
        error: 'Aún no has configurado tu PIN de seguridad. Por favor crea uno primero.',
        hasPin: false,
      });
    }

    const isMatch = await bcrypt.compare(String(pin).trim(), employee.workerPin);
    if (!isMatch) {
      return res.status(401).json({ error: 'PIN de seguridad incorrecto' });
    }

    // Datos seguros para el portal del trabajador
    return res.json({
      employee: {
        id: employee.id,
        dni: employee.dni,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        position: employee.position,
        hireDate: employee.hireDate,
        paymentFrequency: employee.paymentFrequency,
        workSchedule: employee.workSchedule,
        baseSalary: employee.baseSalary,
      },
      payrollRecords: employee.payrollRecords.map((r) => ({
        id: r.id,
        periodId: r.periodId,
        periodName: r.period.name,
        periodCode: r.period.code,
        periodStatus: r.period.status,
        startDate: r.period.startDate,
        endDate: r.period.endDate,
        workedDays: r.workedDays,
        overtimeHours: r.overtimeHours,
        overtimeAmount: r.overtimeAmount,
        bonusesAmount: r.bonusesAmount,
        advancesDeduction: r.advancesDeduction,
        otherDeductions: r.otherDeductions,
        totalEarnings: r.totalEarnings,
        totalDeductions: r.totalDeductions,
        netAmount: r.netAmount,
        status: r.status,
        paidAt: r.paidAt,
        items: r.items,
      })),
      advances: employee.advances.map((a) => ({
        id: a.id,
        amount: a.amount,
        reason: a.reason,
        requestDate: a.requestDate,
        status: a.status,
      })),
      attendances: employee.attendances.map((att) => ({
        id: att.id,
        type: att.type,
        timestamp: att.timestamp,
        latitude: att.latitude,
        longitude: att.longitude,
      })),
    });
  } catch (error) {
    console.error('Error en portal de trabajador:', error);
    return res.status(500).json({ error: 'Error al consultar datos del trabajador' });
  }
};
