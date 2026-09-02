import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Limpiando base de datos y sembrando cuenta de Administrador Beto...');

  // Eliminar datos previos
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.advance.deleteMany();
  await prisma.payrollPeriod.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear Usuario SUPERADMIN Principal (Beto)
  const hashedPassword = await bcrypt.hash('20202020', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'betito01.hra@gmail.com',
      password: hashedPassword,
      name: 'Beto Rivero',
      role: Role.SUPERADMIN,
    },
  });

  console.log('✅ Usuario Administrador creado exitosamente:', adminUser.email);
  console.log('✨ Base de datos lista en blanco para ingresar tus trabajadores reales.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
