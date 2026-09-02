# Sistema de Gestión de Nóminas y Salarios - ImportRivero

Sistema integral y escalable diseñado para el registro, liquidación y control de salarios de trabajadores con modalidad de cobro **Semanal** (Almacén, Choferes, Estibadores) y **Mensual** (Ventas, Facturación y Administración).

---

## 🌟 Características Principales

1. **Gestión de Salarios Dual**:
   - **Cobro Semanal**: Cálculo automático de 7 días, horas extras con recargo (150%), bonos de productividad y deducción automática de anticipos.
   - **Cobro Mensual**: Cálculo sobre 30 días, comisiones por ventas, horas extras, aportes de ley y anticipos.
2. **Control de Acceso por Roles (RBAC)**:
   - `SUPERADMIN`: Control maestro (Don Carlos Rivero).
   - `ADMINISTRADOR`: Gestión y liquidación de planillas, aprobación de pagos.
   - `OFICINA`: Facturación, compras y registro de solicitudes de adelantos.
   - `VENTAS`: Consulta de comisiones y recibos de pago individuales.
   - `LOGÍSTICA`: Operadores, choferes y estibadores con boletas semanales.
3. **Control Automático de Adelantos / Préstamos**:
   - Registro de anticipos que se vinculan y descuentan en el corte de pago correspondiente.
4. **Comprobantes y Reportes**:
   - **Boleta de Pago en PDF** oficial con membrete corporativo, desglose y firmas de conformidad.
   - **Planilla Bancaria en Excel (.xlsx)** para transferencias masivas y contabilidad.

---

## 🚀 Arquitectura y Despliegue

### 1. Frontend (Vercel)
- **Tecnología**: React + TypeScript + Tailwind CSS + Vite
- **Despliegue en Vercel**:
  1. Conectar el repositorio de GitHub en [Vercel](https://vercel.com).
  2. Configurar el **Root Directory** como `frontend`.
  3. Framework Preset: **Vite**.
  4. Variables de entorno (opcional si conecta al backend):
     - `VITE_API_URL`: URL del backend en Render (ej: `https://importrivero-backend.onrender.com/api`).
  5. Clic en **Deploy**.

### 2. Backend (Render)
- **Tecnología**: Node.js + Express + TypeScript + Prisma ORM
- **Base de Datos**: PostgreSQL (Render PostgreSQL, Supabase o Neon)
- **Despliegue en Render**:
  1. En [Render.com](https://render.com), crear una **PostgreSQL Database** (obtener la `DATABASE_URL`).
  2. Crear un **Web Service**:
     - Conectar el repositorio.
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run prisma:generate && npm run build`
     - **Start Command**: `npx prisma db push && npm start` (o `npm run prisma:deploy && npm start`)
  3. Variables de entorno en Render:
     - `DATABASE_URL`: URL de conexión a PostgreSQL.
     - `JWT_SECRET`: Llave secreta para tokens.
     - `FRONTEND_URL`: URL de tu frontend en Vercel.

---

## 💻 Ejecución Local

### Backend:
```bash
cd backend
npm install
cp .env.example .env
# Configurar DATABASE_URL en .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```
Abre en tu navegador `http://localhost:3000`.
