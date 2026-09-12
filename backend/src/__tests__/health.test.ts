import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('Health Endpoint', () => {
  it('should return ok for health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });
});
