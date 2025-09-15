const request = require('supertest');
const app = require('../server');

describe('Server Tests', () => {
  test('GET / should return index.html', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('<!DOCTYPE html>');
  });

  test('GET /api/programs should return programs', async () => {
    const response = await request(app)
      .get('/api/programs')
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('programs');
    expect(Array.isArray(response.body.data.programs)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
    
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  test('POST /api/auth/login with invalid credentials should return 401', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
    
    expect(response.body).toHaveProperty('success', false);
  });
});
