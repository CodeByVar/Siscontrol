import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Verificar trabajador por su C.I. (Público para el portal móvil)
export const verifyWorkerByDni = async (req: Request, res: Response) => {
  const { dni } = req.params;

  if (!dni) {
    return res.status(400).json({ error: 'El C.I. es obligatorio' });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { dni: String(dni).trim() },
      select: {
        id: true,
        dni: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        status: true,
        paymentFrequency: true,
        workSchedule: true,
        qrImageUrl: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'No se encontró ningún trabajador con el C.I. ingresado' });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'El trabajador no se encuentra activo en el sistema' });
    }

    // Consultar el historial de marcajes de hoy para este trabajador
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        timestamp: { gte: startOfToday },
      },
      orderBy: { timestamp: 'desc' },
    });

    const latestAttendanceToday = todayAttendances[0] || null;

    let statusToday: 'AUSENTE' | 'PRESENTE' | 'FINALIZO_JORNADA' = 'AUSENTE';
    let canCheckIn = true;
    let canCheckOut = false;
    let checkInDisabledReason = '';
    let checkOutDisabledReason = '';

    if (!latestAttendanceToday) {
      statusToday = 'AUSENTE';
      canCheckIn = true;
      canCheckOut = false;
      checkOutDisabledReason = 'Debes registrar tu ENTRADA antes de poder marcar la salida.';
    } else if (latestAttendanceToday.type === 'CHECK_IN') {
      statusToday = 'PRESENTE';
      canCheckIn = false;
      canCheckOut = true;
      const timeStr = new Date(latestAttendanceToday.timestamp).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      });
      checkInDisabledReason = `Ya registraste tu ENTRADA hoy a las ${timeStr}. Tu siguiente registro debe ser tu SALIDA.`;
    } else if (latestAttendanceToday.type === 'CHECK_OUT') {
      statusToday = 'FINALIZO_JORNADA';
      canCheckIn = false;
      canCheckOut = false;
      const timeStr = new Date(latestAttendanceToday.timestamp).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      });
      checkInDisabledReason = `Ya registraste tu SALIDA hoy a las ${timeStr}. Tu jornada de hoy ya está concluida.`;
      checkOutDisabledReason = `Ya registraste tu SALIDA hoy a las ${timeStr}. No es necesario volver a marcar.`;
    }

    return res.json({
      employee,
      latestAttendanceToday,
      todayAttendances,
      suggestedNextType: latestAttendanceToday?.type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN',
      statusToday,
      canCheckIn,
      canCheckOut,
      checkInDisabledReason,
      checkOutDisabledReason,
    });
  } catch (error) {
    console.error('Error al verificar trabajador por C.I.:', error);
    return res.status(500).json({ error: 'Error al verificar trabajador' });
  }
};

// 2. Registrar Marcaje con GPS (Público para el portal móvil de trabajadores)
export const recordAttendance = async (req: Request, res: Response) => {
  const { dni, type, latitude, longitude, accuracy, deviceInfo, notes } = req.body;

  if (!dni) {
    return res.status(400).json({ error: 'El C.I. del trabajador es obligatorio' });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { dni: String(dni).trim() },
    });

    if (!employee) {
      return res.status(404).json({ error: 'No se encontró ningún trabajador registrado con este C.I.' });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'El trabajador no se encuentra en estado activo' });
    }

    const attendanceType = type === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN';

    // Validación estricta anti-duplicados para el mismo día
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const latestAttendanceToday = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        timestamp: { gte: startOfToday },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (attendanceType === 'CHECK_IN') {
      if (latestAttendanceToday && latestAttendanceToday.type === 'CHECK_IN') {
        const timeStr = new Date(latestAttendanceToday.timestamp).toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return res.status(400).json({
          error: `Ya tienes una ENTRADA registrada hoy a las ${timeStr}. No puedes registrar doble entrada; tu siguiente marcaje debe ser tu SALIDA.`,
        });
      }
      if (latestAttendanceToday && latestAttendanceToday.type === 'CHECK_OUT') {
        const timeStr = new Date(latestAttendanceToday.timestamp).toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return res.status(400).json({
          error: `Ya registraste tu SALIDA de hoy a las ${timeStr}. Tu jornada de hoy ya está concluida.`,
        });
      }
    } else if (attendanceType === 'CHECK_OUT') {
      if (!latestAttendanceToday) {
        return res.status(400).json({
          error: 'No puedes marcar SALIDA sin haber registrado previamente una ENTRADA el día de hoy.',
        });
      }
      if (latestAttendanceToday.type === 'CHECK_OUT') {
        const timeStr = new Date(latestAttendanceToday.timestamp).toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return res.status(400).json({
          error: `Ya registraste tu SALIDA hoy a las ${timeStr}. No puedes registrar doble salida.`,
        });
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        type: attendanceType,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        accuracy: accuracy ? Number(accuracy) : null,
        deviceInfo: deviceInfo ? String(deviceInfo) : null,
        notes: notes ? String(notes) : null,
      },
      include: {
        employee: {
          select: {
            id: true,
            dni: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: attendanceType === 'CHECK_IN' ? '¡Entrada registrada con éxito!' : '¡Salida registrada con éxito!',
      attendance,
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return res.status(500).json({ error: 'Error al registrar marcaje de asistencia' });
  }
};

// 3. Obtener lista de marcajes con filtros (Protegido para Administrador)
export const getAttendances = async (req: Request, res: Response) => {
  const { date, employeeId, type } = req.query;

  try {
    const where: any = {};

    if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (type && (type === 'CHECK_IN' || type === 'CHECK_OUT')) {
      where.type = type;
    }

    if (date) {
      const selectedDate = new Date(String(date));
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.timestamp = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            dni: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
            workSchedule: true,
            qrImageUrl: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return res.json(attendances);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return res.status(500).json({ error: 'Error al consultar asistencias' });
  }
};

// 4. Resumen y Estadísticas del Día de Hoy (Protegido para Administrador)
export const getTodaySummary = async (req: Request, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, dni: true, firstName: true, lastName: true, department: true, position: true },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        employee: {
          select: { id: true, dni: true, firstName: true, lastName: true, department: true, position: true },
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Mapear el estado de cada trabajador hoy
    const employeeStatusMap = new Map<string, {
      employee: any;
      firstCheckIn?: Date;
      lastCheckOut?: Date;
      currentStatus: 'PRESENTE' | 'FINALIZO_JORNADA' | 'AUSENTE';
      latestRecord?: any;
    }>();

    activeEmployees.forEach((emp) => {
      employeeStatusMap.set(emp.id, {
        employee: emp,
        currentStatus: 'AUSENTE',
      });
    });

    todayAttendances.forEach((att) => {
      const current = employeeStatusMap.get(att.employeeId);
      if (current) {
        current.latestRecord = att;
        if (att.type === 'CHECK_IN') {
          if (!current.firstCheckIn) current.firstCheckIn = att.timestamp;
          current.currentStatus = 'PRESENTE';
        } else if (att.type === 'CHECK_OUT') {
          current.lastCheckOut = att.timestamp;
          current.currentStatus = 'FINALIZO_JORNADA';
        }
      }
    });

    const statusList = Array.from(employeeStatusMap.values());
    const presentCount = statusList.filter((s) => s.currentStatus === 'PRESENTE').length;
    const finishedCount = statusList.filter((s) => s.currentStatus === 'FINALIZO_JORNADA').length;
    const absentCount = statusList.filter((s) => s.currentStatus === 'AUSENTE').length;

    return res.json({
      totalEmployees: activeEmployees.length,
      presentNow: presentCount,
      finishedDay: finishedCount,
      absentToday: absentCount,
      totalCheckedInToday: presentCount + finishedCount,
      records: statusList,
    });
  } catch (error) {
    console.error('Error al obtener resumen de hoy:', error);
    return res.status(500).json({ error: 'Error al generar resumen diario' });
  }
};
