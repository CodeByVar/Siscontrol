import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS para aceptar peticiones desde Vercel o local
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check para Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ImportRivero Payroll Backend', timestamp: new Date() });
});

// Rutas de la API
app.use('/api', apiRoutes);

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Error inesperado en el servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ImportRivero corriendo en puerto ${PORT}`);
});
