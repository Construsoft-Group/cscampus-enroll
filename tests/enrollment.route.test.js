import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../src/app.js'; // or wherever your app is defined

jest.mock('../src/services/enrollment.service.js', () => ({
  extendUserEnrollment: jest.fn(() => Promise.resolve({
    userid: 18286,
    courseid: 212,
    extendedBy: 2,
    status: 'success'
  }))
}));

describe('POST /enrollment/extend', () => {
  it('should extend enrollment for a user', async () => {
    const res = await request(app)
      .post('/enrollment/extend')
      .send({ userid: 18286, courseid: 212, months: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.userid).toBe(18286);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/enrollment/extend')
      .send({ userid: 1 });

    expect(res.statusCode).toBe(400);
  });
});
