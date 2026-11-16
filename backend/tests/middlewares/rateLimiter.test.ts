import { describe, it, expect } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import {
  authLimiter,
  refreshLimiter,
  defaultLimiter,
  DEFAULT_LIMIT_PER_IP,
} from '../../src/middlewares/rateLimiter.middleware.js';
import { generateAccessToken } from '../../src/utils/jwt.js';

const ok = (_req: express.Request, res: express.Response) => res.json({ ok: true });

const hit = async (app: express.Application, path: string, times: number, body?: object, cookie?: string) => {
  let last = 0;
  for (let i = 0; i < times; i++) {
    const r = request(app).post(path);
    if (cookie) r.set('Cookie', cookie);
    last = (await r.send(body ?? {})).status;
  }
  return last;
};

describe('rate limiters', () => {
  it('does not apply the 10-per-window login limit to /auth/refresh', async () => {
    const app = express();
    app.use(express.json());
    app.post('/refresh', refreshLimiter, ok);
    expect(await hit(app, '/refresh', 30)).toBe(200);
  });

  it('limits login per phone number, not for everyone behind the same IP', async () => {
    const app = express();
    app.use(express.json());
    app.post('/login', authLimiter, ok);

    expect(await hit(app, '/login', 10, { phoneNumber: '0911111111' })).toBe(200);
    expect(await hit(app, '/login', 1, { phoneNumber: '0911111111' })).toBe(429);
    // Another person on the same Wi-Fi can still log in.
    expect(await hit(app, '/login', 1, { phoneNumber: '0922222222' })).toBe(200);
  });

  it('never limits /health', async () => {
    const app = express();
    app.use(cookieParser());
    app.use(defaultLimiter);
    app.get('/health', ok);
    let status = 0;
    for (let i = 0; i < DEFAULT_LIMIT_PER_IP + 5; i++) {
      status = (await request(app).get('/health')).status;
    }
    expect(status).toBe(200);
  });

  it('keys signed-in traffic by account so another account on the same IP is not blocked', async () => {
    const app = express();
    app.use(cookieParser());
    app.use(defaultLimiter);
    app.post('/x', ok);

    // Anonymous traffic from this IP uses up the per-IP budget...
    expect(await hit(app, '/x', DEFAULT_LIMIT_PER_IP)).toBe(200);
    expect(await hit(app, '/x', 1)).toBe(429);
    // ...but a signed-in account has its own bucket.
    const cookie = `access_token=${generateAccessToken({ accountId: 'acc-1' })}`;
    expect(await hit(app, '/x', 1, {}, cookie)).toBe(200);
  });
});
