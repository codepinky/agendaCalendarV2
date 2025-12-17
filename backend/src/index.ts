import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import authRoutes from './routes/auth';
import licenseRoutes from './routes/licenses';
import googleCalendarRoutes from './routes/googleCalendar';
import slotsRoutes from './routes/slots';
import bookingsRoutes from './routes/bookings';

app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

