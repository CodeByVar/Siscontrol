"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando carga de datos de prueba para ImportRivero...');
    // Limpiar datos previos
    await prisma.payrollItem.deleteMany();
    await prisma.advance.deleteMany();
    await prisma.payrollRecord.deleteMany();
    await prisma.payrollPeriod.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.user.deleteMany();
    const passwordHash = await bcryptjs_1.default.hash('123456', 10);
    // 1. Crear Usuarios con los roles solicitados
    const superAdminUser = await prisma.user.create({
        data: {
            email: 'superadmin@importrivero.com',
            password: passwordHash,
            name: 'Don Carlos Rivero (Propietario / Jefe)',
            role: 'SUPERADMIN',
        },
    });
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@importrivero.com',
            password: passwordHash,
            name: 'María Fernández (Administradora)',
            role: 'ADMINISTRADOR',
        },
    });
    const oficinaUser = await prisma.user.create({
        data: {
            email: 'oficina@importrivero.com',
            password: passwordHash,
            name: 'Patricia Morales (Asistente Oficina)',
            role: 'OFICINA',
        },
    });
    const ventasUser = await prisma.user.create({
        data: {
            email: 'ventas@importrivero.com',
            password: passwordHash,
            name: 'Rodrigo Gómez (Ejecutivo de Ventas)',
            role: 'VENTAS',
        },
    });
    const logisticaUser = await prisma.user.create({
        data: {
            email: 'logistica@importrivero.com',
            password: passwordHash,
            name: 'Juan Quispe (Almacén & Logística)',
            role: 'LOGISTICA',
        },
    });
    console.log('✅ Usuarios creados');
    // 2. Crear Empleados (Semanales y Mensuales)
    const emp1 = await prisma.employee.create({
        data: {
            dni: '74839201',
            firstName: 'Rodrigo',
            lastName: 'Gómez Salazar',
            email: 'ventas@importrivero.com',
            phone: '+591 71234567',
            department: 'VENTAS',
            position: 'Ejecutivo de Ventas Mayoristas',
            paymentFrequency: 'MENSUAL',
            baseSalary: 4500.0,
            bankName: 'Banco Nacional',
            bankAccountNumber: '4010-8921-99',
            userId: ventasUser.id,
        },
    });
    const emp2 = await prisma.employee.create({
        data: {
            dni: '63920184',
            firstName: 'Juan',
            lastName: 'Quispe Mamani',
            email: 'logistica@importrivero.com',
            phone: '+591 78901234',
            department: 'LOGISTICA',
            position: 'Operador de Almacén & Despacho',
            paymentFrequency: 'SEMANAL',
            baseSalary: 750.0, // Salario semanal (Bs / $)
            bankName: 'Banco Mercantil',
            bankAccountNumber: '1029-4821-33',
            userId: logisticaUser.id,
        },
    });
    const emp3 = await prisma.employee.create({
        data: {
            dni: '58291047',
            firstName: 'Carlos',
            lastName: 'Vargas Torrico',
            email: 'cvargas@importrivero.com',
            phone: '+591 76543210',
            department: 'LOGISTICA',
            position: 'Chofer Distribuidor',
            paymentFrequency: 'SEMANAL',
            baseSalary: 800.0,
            bankName: 'Banco Unión',
            bankAccountNumber: '5920-1192-88',
        },
    });
    const emp4 = await prisma.employee.create({
        data: {
            dni: '81920384',
            firstName: 'Patricia',
            lastName: 'Morales Silva',
            email: 'oficina@importrivero.com',
            phone: '+591 70011223',
            department: 'OFICINA',
            position: 'Encargada de Facturación y Compras',
            paymentFrequency: 'MENSUAL',
            baseSalary: 3800.0,
            bankName: 'Banco de Crédito',
            bankAccountNumber: '2109-3847-55',
            userId: oficinaUser.id,
        },
    });
    const emp5 = await prisma.employee.create({
        data: {
            dni: '49201948',
            firstName: 'Pedro',
            lastName: 'Mendoza Aliaga',
            email: 'pmendoza@importrivero.com',
            phone: '+591 73344556',
            department: 'LOGISTICA',
            position: 'Estibador y Carga',
            paymentFrequency: 'SEMANAL',
            baseSalary: 650.0,
            bankName: 'Efectivo / Caja',
        },
    });
    console.log('✅ Empleados creados');
    // 3. Crear Adelantos
    await prisma.advance.create({
        data: {
            employeeId: emp2.id,
            amount: 150.0,
            reason: 'Urgencia familiar - medicina',
            status: 'PENDING',
        },
    });
    await prisma.advance.create({
        data: {
            employeeId: emp1.id,
            amount: 500.0,
            reason: 'Adelanto quincenal para gastos personales',
            status: 'PENDING',
        },
    });
    console.log('✅ Adelantos registrados');
    // 4. Crear Periodos de Nómina
    const weeklyPeriod = await prisma.payrollPeriod.create({
        data: {
            code: 'SEM-2026-W35',
            name: 'Semana 35 (25 Ago - 31 Ago 2026)',
            frequency: 'SEMANAL',
            startDate: new Date('2026-08-25T00:00:00Z'),
            endDate: new Date('2026-08-31T23:59:59Z'),
            year: 2026,
            periodNumber: 35,
            status: 'OPEN',
        },
    });
    const monthlyPeriod = await prisma.payrollPeriod.create({
        data: {
            code: 'MES-2026-08',
            name: 'Mes de Agosto 2026 (01 Ago - 31 Ago)',
            frequency: 'MENSUAL',
            startDate: new Date('2026-08-01T00:00:00Z'),
            endDate: new Date('2026-08-31T23:59:59Z'),
            year: 2026,
            periodNumber: 8,
            status: 'OPEN',
        },
    });
    console.log('✅ Periodos de nómina creados');
    console.log('✨ Seed completado con éxito.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
