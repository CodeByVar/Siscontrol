import { Request, Response } from 'express';
import { PrismaClient, PaymentFrequency, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const getEmployees = async (req: Request, res: Response) => {
  const { frequency, department, search, status } = req.query;

  try {
    const whereClause: any = {};

    if (frequency) {
      whereClause.paymentFrequency = frequency as PaymentFrequency;
    }
    if (department) {
      whereClause.department = department as Role;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { dni: { contains: String(search) } },
        { position: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        advances: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(employees);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    return res.status(500).json({ error: 'Error al listar empleados' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        advances: true,
        payrollRecords: {
          include: { period: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  const {
    dni,
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    paymentFrequency,
    workSchedule,
    baseSalary,
    bankName,
    bankAccountNumber,
    qrImageUrl,
    notes,
  } = req.body;

  if (!dni || !firstName || !lastName || !department || !position || !baseSalary) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para registrar al empleado' });
  }

  try {
    const existing = await prisma.employee.findUnique({ where: { dni } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un empleado con este DNI/Identificación' });
    }

    const employee = await prisma.employee.create({
      data: {
        dni,
        firstName,
        lastName,
        email,
        phone,
        department,
        position,
        paymentFrequency: paymentFrequency || 'SEMANAL',
        workSchedule: workSchedule || 'LUNES_A_SABADO',
        baseSalary: Number(baseSalary),
        bankName,
        bankAccountNumber,
        qrImageUrl,
        notes,
      },
    });

    return res.status(201).json(employee);
  } catch (error) {
    console.error('Error al crear empleado:', error);
    return res.status(500).json({ error: 'Error al registrar empleado' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    if (data.baseSalary) {
      data.baseSalary = Number(data.baseSalary);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data,
    });

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.employee.delete({ where: { id } });
    return res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};
