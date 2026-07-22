import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import aqiRoutes  from './routes/aqi.routes.js';
import forecastRoutes from './routes/forecast.routes.js';
import enforcementRoutes from './routes/enforcement.routes.js';
import citizenRoutes from './routes/citizen.routes.js';
import vulnerabilityRoutes from './routes/vulnerability.routes.js';
import settingsRoutes from './routes/settings.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/aqi',  aqiRoutes);
app.use('/api/aqi',  forecastRoutes);
app.use('/api/enforcement', enforcementRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/vulnerability', vulnerabilityRoutes);
app.use('/api/settings', settingsRoutes);


// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VayuSense API', timestamp: new Date().toISOString() });
});

// --- Start Server ---
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 VayuSense API server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS origin: http://localhost:5173\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
