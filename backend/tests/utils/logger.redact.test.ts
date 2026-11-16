import { describe, it, expect } from 'vitest';
import { Writable } from 'stream';
import express from 'express';
import request from 'supertest';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { baseLoggerOptions } from '../../src/utils/logger.js';

const SECRETS = ['access-token-secret-value', 'refresh-token-secret-value', 'Bearer abc.def.ghi', 'hunter2-password'];

describe('logger redaction', () => {
  it('never writes cookies, authorization, set-cookie or passwords to the log', async () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        lines.push(chunk.toString());
        cb();
      },
    });
    const logger = pino({ ...baseLoggerOptions, level: 'debug' }, sink);

    const app = express();
    app.use(express.json());
    app.use(pinoHttp({ logger }));
    app.post('/login', (req, res) => {
      req.log.info({ body: req.body }, 'body seen by handler');
      res.cookie('access_token', 'access-token-secret-value');
      res.json({ ok: true });
    });

    await request(app)
      .post('/login')
      .set('Cookie', 'access_token=access-token-secret-value; refresh_token=refresh-token-secret-value')
      .set('Authorization', 'Bearer abc.def.ghi')
      .send({ phoneNumber: '0911000000', password: 'hunter2-password' });

    const output = lines.join('\n');
    expect(output.length).toBeGreaterThan(0);
    for (const secret of SECRETS) {
      expect(output).not.toContain(secret);
    }
    expect(output).toContain('[REDACTED]');
  });
});
