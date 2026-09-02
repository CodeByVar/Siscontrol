import { login, getProfile, changePassword } from '../controllers/auth.controller';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller';
import {
  getPeriods,
  createPeriod,
  generatePayrollForPeriod,
  getPayrollRecordsByPeriod,
  updatePayrollRecord,
  payPayrollPeriod,
} from '../controllers/payroll.controller';
import {
  getAdvances,
  createAdvance,
  updateAdvanceStatus,
  deleteAdvance,
} from '../controllers/advance.controller';
import { getDashboardMetrics } from '../controllers/dashboard.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth';

const router = Router();

// Rutas Públicas
router.post('/auth/login', login);

// Rutas Protegidas (Requieren Token)
router.use(authenticateJWT);

// Perfil y Seguridad
router.get('/auth/profile', getProfile);
router.post('/auth/change-password', changePassword);

// Dashboard (Acceso: SUPERADMIN, ADMINISTRADOR, OFICINA)
router.get(
  '/dashboard/metrics',
  requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']),
  getDashboardMetrics
);

// Empleados
router.get('/employees', requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']), getEmployees);
router.get('/employees/:id', getEmployeeById);
router.post('/employees', requireRoles(['SUPERADMIN', 'ADMINISTRADOR']), createEmployee);
router.put('/employees/:id', requireRoles(['SUPERADMIN', 'ADMINISTRADOR']), updateEmployee);
router.delete('/employees/:id', requireRoles(['SUPERADMIN']), deleteEmployee);

// Adelantos / Préstamos
router.get('/advances', requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']), getAdvances);
router.post('/advances', requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']), createAdvance);
router.patch('/advances/:id/status', requireRoles(['SUPERADMIN', 'ADMINISTRADOR']), updateAdvanceStatus);
router.delete('/advances/:id', requireRoles(['SUPERADMIN', 'ADMINISTRADOR']), deleteAdvance);

// Periodos y Nómina
router.get('/payrolls/periods', requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']), getPeriods);
router.post('/payrolls/periods', requireRoles(['SUPERADMIN', 'ADMINISTRADOR']), createPeriod);
router.post(
  '/payrolls/periods/:periodId/generate',
  requireRoles(['SUPERADMIN', 'ADMINISTRADOR']),
  generatePayrollForPeriod
);
router.get(
  '/payrolls/periods/:periodId/records',
  requireRoles(['SUPERADMIN', 'ADMINISTRADOR', 'OFICINA']),
  getPayrollRecordsByPeriod
);
router.put(
  '/payrolls/records/:id',
  requireRoles(['SUPERADMIN', 'ADMINISTRADOR']),
  updatePayrollRecord
);
router.post(
  '/payrolls/periods/:periodId/pay',
  requireRoles(['SUPERADMIN', 'ADMINISTRADOR']),
  payPayrollPeriod
);

export default router;
