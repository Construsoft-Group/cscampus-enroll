// ✅ Must be at top
import { jest } from '@jest/globals';

// ✅ Mock modules before importing app
jest.unstable_mockModule('../src/config/moodle.js', () => ({
  extendEnrollment: jest.fn(),
  addUserToMoodleGroup: jest.fn(),
  createMoodleUser: jest.fn(),
  enrollMoodleuser: jest.fn(),
  queryMoodleUser: jest.fn()
}));

jest.unstable_mockModule('../src/database.js', () => ({
  default: {
    query: jest.fn()
  }
}));

jest.unstable_mockModule('../src/helpers/log.helper.js', () => ({
  logEnrollmentFailureToFile: jest.fn()
}));

// ✅ Import app after mocks
const request = (await import('supertest')).default;
const app = (await import('../src/app.js')).default;
const { extendEnrollment } = await import('../src/config/moodle.js');
const pool = (await import('../src/database.js')).default;

describe('POST /enrollment/extend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ should extend enrollment successfully', async () => {
    extendEnrollment.mockResolvedValue({
      data: {}
    });

    pool.query.mockResolvedValue({});

    const res = await request(app)
      .post('/enrollment/extend')
      .send({
        userid: 18286,
        courseid: 212,
        months: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.status).toBe('enrolled');
    expect(pool.query).toHaveBeenCalledTimes(1); // ✅ this should now pass
  });

  it('❌ should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/enrollment/extend')
      .send({ userid: 18286 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('❌ should handle Moodle API failure', async () => {
    extendEnrollment.mockRejectedValue(
      new Error('Invalid token - token not found')
    );

    const res = await request(app)
      .post('/enrollment/extend')
      .send({
        userid: 18286,
        courseid: 212,
        months: 2
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Invalid token/);
    expect(pool.query).not.toHaveBeenCalled(); // ✅ should pass now
  });

  it('✅ should fallback log if DB insert fails', async () => {
    extendEnrollment.mockResolvedValue({
      data: {}
    });

    pool.query.mockRejectedValue(new Error('DB connection timeout'));

    const res = await request(app)
      .post('/enrollment/extend')
      .send({
        userid: 18286,
        courseid: 212,
        months: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.status).toBe('enrolled');
  });
});
