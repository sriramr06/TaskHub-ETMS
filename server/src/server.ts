import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { connectDB } from '@/config/database';
import '@/config/cloudinary';
import { apiLimiter } from '@/middlewares/rateLimiter';
import { notFound } from '@/middlewares/notFound';
import { errorHandler } from '@/middlewares/errorHandler';
import { logger } from '@/utils/logger';
import authRoutes from '@/routes/auth.routes';
import employeeRoutes from '@/routes/employee.routes';
import teamRoutes from '@/routes/team.routes';
import projectRoutes from '@/routes/project.routes';

const app = express();
connectDB();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
