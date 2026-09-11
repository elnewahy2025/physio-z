import request from 'supertest';
import app from '../app';

describe('Auth Endpoints', () => {
  it('should return 401 for unauthorized access to protected route', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toEqual(401);
  });
});
