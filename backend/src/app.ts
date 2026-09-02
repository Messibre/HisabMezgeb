import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';

// Utilities & Configs
import { env } from './config/env.js';
import logger from './utils/logger.js';
import ApiError from './utils/ApiError.js';
import { SuccessResponse } from './utils/ApiResponse.js';
import { HTTP_STATUS } from './constants/index.js';

// Middlewares & Routes
import { defaultLimiter } from './middlewares/rateLimiter.middleware.js';
import errorMiddleware from './middlewares/error.middleware.js';
import router from './routes/index.js';

const app = express();

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(
  (pinoHttp as any)({
    logger,
    genReqId: (req: IncomingMessage) => (req as any).id || randomUUID(),
  }),
);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(defaultLimiter);

//  Parse cookies
app.use(cookieParser());

// Body Parsing Configurations
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api/v1', router);

app.get('/health', (req, res) => {
  return res
    .status(HTTP_STATUS.OK)
    .json(new SuccessResponse(HTTP_STATUS.OK, 'Server is running healthily', { status: 'ok' }));
});

app.use((req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route ${req.method} ${req.path} not found`));
});

app.use(errorMiddleware);

export default app;
