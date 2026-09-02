import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'importrivero_super_secret_jwt_key_2026';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    // Auto-crear cuenta admin principal si es la primera vez en la BD
    if (!user && email.toLowerCase().trim() === 'betito01.hra@gmail.com' && password === '20202020') {
      const hashedPassword = await bcrypt.hash('20202020', 10);
      user = await prisma.user.create({
        data: {
          email: 'betito01.hra@gmail.com',
          password: hashedPassword,
          name: 'Beto Rivero',
          role: 'SUPERADMIN',
        },
        include: { employee: true },
      });
    }

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employee: true,
      },
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Debes ingresar tu contraseña actual y la nueva contraseña' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ error: 'Error en el servidor al cambiar la contraseña' });
  }
};
