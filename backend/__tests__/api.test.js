/**
 * Unit tests for ProjectPulse backend API.
 * Uses jest.mock with factory functions for Mongoose models.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';

// ---- Mock DB connection ----
jest.mock('../config/db', () => jest.fn().mockResolvedValue(true));

// ---- Mock Mongoose models ----
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../models/Project', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Team', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/WeeklyUpdate', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../models/AIInsight', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Document', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/DocumentRequest', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Doubt', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/MeetingSchedule', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Evaluation', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/IndustryProject', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/Application', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Doubt = require('../models/Doubt');
const MeetingSchedule = require('../models/MeetingSchedule');
const Evaluation = require('../models/Evaluation');
const IndustryProject = require('../models/IndustryProject');
const Application = require('../models/Application');
const DocumentRequest = require('../models/DocumentRequest');
const Document = require('../models/Document');

const app = require('../server');

const SECRET = 'testsecret';

const PROFESSOR = { _id: 'prof123', id: 'prof123', name: 'Dr. Smith', email: 'professor@test.com', role: 'professor', department: 'CS' };
const STUDENT = { _id: 'stud456', id: 'stud456', name: 'Alice', email: 'alice@test.com', role: 'student' };

/** Create a signed JWT for a user object */
const makeToken = (user) => jwt.sign({ id: user._id }, SECRET, { expiresIn: '1d' });

/**
 * Mock User.findById to support the chained .select() call used in auth middleware.
 * The middleware does: await User.findById(id).select('-password')
 */
const mockFindByIdForAuth = (userDoc) => {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue(userDoc),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---- Health check ----
describe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ProjectPulse API');
  });
});

// ---- Auth: Register ----
describe('POST /api/auth/register', () => {
  it('registers a user and returns a token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ ...PROFESSOR, _id: 'newid' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Dr. Smith', email: 'professor@test.com', password: 'pass123', role: 'professor',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    User.findOne.mockResolvedValue(PROFESSOR);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Dr. Smith', email: 'professor@test.com', password: 'pass123', role: 'professor',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });
});

// ---- Auth: Login ----
describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const matchPassword = jest.fn().mockResolvedValue(true);
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ ...PROFESSOR, matchPassword }) });

    const res = await request(app).post('/api/auth/login').send({ email: 'professor@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const matchPassword = jest.fn().mockResolvedValue(false);
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ ...PROFESSOR, matchPassword }) });

    const res = await request(app).post('/api/auth/login').send({ email: 'professor@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app).post('/api/auth/login').send({ email: 'noone@test.com', password: 'pass' });
    expect(res.status).toBe(401);
  });

  it('rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

// ---- Auth: Get Profile ----
describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    mockFindByIdForAuth(PROFESSOR);
    // getMe also calls User.findById; second call returns the user directly
    User.findById.mockReturnValueOnce({ select: jest.fn().mockResolvedValue(PROFESSOR) })
                 .mockResolvedValueOnce(PROFESSOR);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(PROFESSOR.email);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

// ---- Projects: Create ----
describe('POST /api/projects', () => {
  it('allows professor to create a project', async () => {
    mockFindByIdForAuth(PROFESSOR);
    Project.create.mockResolvedValue({ _id: 'proj1', title: 'AI Research', inviteCode: 'ABC123' });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({
        title: 'AI Research', description: 'Desc', course: 'CS101',
        semester: 'Fall 2026',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.project.title).toBe('AI Research');
  });

  it('forbids student from creating a project', async () => {
    mockFindByIdForAuth(STUDENT);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ title: 'Hack', description: 'x', startDate: new Date(), endDate: new Date() });
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/projects').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });
});

// ---- Projects: Join ----
describe('POST /api/projects/join', () => {
  it('allows student to join with valid invite code', async () => {
    mockFindByIdForAuth(STUDENT);
    Project.findOne.mockResolvedValue({ _id: 'proj1', inviteCode: 'XYZ789' });
    Team.findOne
      .mockResolvedValueOnce(null)  // no existing membership
      .mockResolvedValueOnce(null); // no team with that name
    Team.create.mockResolvedValue({
      _id: 'team1', project: 'proj1', name: 'Team Alpha',
      members: [{ user: STUDENT._id, role: 'leader' }],
    });

    const res = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ inviteCode: 'XYZ789', teamName: 'Team Alpha' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects invalid invite code', async () => {
    mockFindByIdForAuth(STUDENT);
    Project.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ inviteCode: 'INVALID', teamName: 'Team X' });
    expect(res.status).toBe(404);
  });

  it('rejects if student is already in the project', async () => {
    mockFindByIdForAuth(STUDENT);
    Project.findOne.mockResolvedValue({ _id: 'proj1', inviteCode: 'XYZ789' });
    Team.findOne.mockResolvedValueOnce({ _id: 'team2' }); // already a member

    const res = await request(app)
      .post('/api/projects/join')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ inviteCode: 'XYZ789', teamName: 'Team Alpha' });
    expect(res.status).toBe(400);
  });
});

// ---- Weekly Updates ----
describe('POST /api/updates', () => {
  const updatePayload = {
    projectId: 'proj1', teamId: 'team1', weekNumber: 1,
    weekStartDate: new Date().toISOString(),
    completedTasks: [{ title: 'Task 1', hoursSpent: 5 }],
    plannedTasks: [],
    blockers: [],
    individualContribution: 'Worked on data models.',
    contributionPercentage: 50,
    mood: 'good',
    hoursWorked: 10,
  };

  it('allows student to submit a weekly update', async () => {
    mockFindByIdForAuth(STUDENT);
    Team.findById.mockResolvedValue({
      _id: 'team1',
      members: [{ user: { toString: () => STUDENT._id }, role: 'member' }],
    });
    WeeklyUpdate.findOne.mockResolvedValue(null);
    const mockUpdate = { _id: 'upd1', weekNumber: 1, student: STUDENT };
    WeeklyUpdate.create.mockResolvedValue({
      ...mockUpdate,
      populate: jest.fn().mockResolvedValue(mockUpdate),
    });

    const res = await request(app)
      .post('/api/updates')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send(updatePayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects duplicate update for the same week', async () => {
    mockFindByIdForAuth(STUDENT);
    Team.findById.mockResolvedValue({
      _id: 'team1',
      members: [{ user: { toString: () => STUDENT._id }, role: 'member' }],
    });
    WeeklyUpdate.findOne.mockResolvedValue({ _id: 'existing', weekNumber: 1 });

    const res = await request(app)
      .post('/api/updates')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send(updatePayload);
    expect(res.status).toBe(400);
  });

  it('forbids professor from submitting updates', async () => {
    mockFindByIdForAuth(PROFESSOR);

    const res = await request(app)
      .post('/api/updates')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send(updatePayload);
    expect(res.status).toBe(403);
  });
});

// ---- 404 handler ----
describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent/route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ---- Teams: Create (faculty) ----
describe('POST /api/teams', () => {
  it('allows professor to create a team', async () => {
    mockFindByIdForAuth(PROFESSOR);
    Project.findById.mockResolvedValue({ _id: 'proj1', professor: { toString: () => PROFESSOR._id } });
    Team.create.mockResolvedValue({
      _id: 'team1', name: 'Team Alpha', project: 'proj1', members: [],
      populate: jest.fn().mockResolvedValue({ _id: 'team1', name: 'Team Alpha', members: [] }),
    });

    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({ projectId: 'proj1', name: 'Team Alpha' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('forbids student from creating a team', async () => {
    mockFindByIdForAuth(STUDENT);

    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ projectId: 'proj1', name: 'Team Beta' });
    expect(res.status).toBe(403);
  });
});

// ---- Doubts: Create ----
describe('POST /api/doubts', () => {
  it('allows student to create a doubt', async () => {
    mockFindByIdForAuth(STUDENT);
    const mockDoubt = {
      _id: 'doubt1', title: 'How to deploy?', body: 'What is the process?',
      project: 'proj1', askedBy: STUDENT, status: 'open', replies: [],
      populate: jest.fn().mockResolvedValue({}),
    };
    Doubt.create.mockResolvedValue(mockDoubt);

    const res = await request(app)
      .post('/api/doubts')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ projectId: 'proj1', title: 'How to deploy?', body: 'What is the process?' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('forbids professor from creating a doubt', async () => {
    mockFindByIdForAuth(PROFESSOR);

    const res = await request(app)
      .post('/api/doubts')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({ projectId: 'proj1', title: 'Test?', body: 'Testing' });
    expect(res.status).toBe(403);
  });
});

// ---- Doubts: Get project doubts ----
describe('GET /api/doubts/project/:projectId', () => {
  it('returns doubts for a project', async () => {
    mockFindByIdForAuth(PROFESSOR);
    Doubt.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/doubts/project/proj1')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.doubts)).toBe(true);
  });
});

// ---- Meetings: Schedule ----
describe('POST /api/doubts/meetings', () => {
  it('allows professor to schedule a meeting', async () => {
    mockFindByIdForAuth(PROFESSOR);
    const mockMeeting = {
      _id: 'meet1', title: 'Sprint Review', scheduledAt: new Date(),
      populate: jest.fn().mockResolvedValue({ _id: 'meet1', title: 'Sprint Review' }),
    };
    MeetingSchedule.create.mockResolvedValue(mockMeeting);

    const res = await request(app)
      .post('/api/doubts/meetings')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({
        projectId: 'proj1', title: 'Sprint Review',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ---- Evaluations: Create ----
describe('POST /api/evaluations', () => {
  it('allows professor to create an evaluation', async () => {
    mockFindByIdForAuth(PROFESSOR);
    const finalEval = { _id: 'eval1', marks: 85, evaluationType: 'individual' };
    Evaluation.findOneAndUpdate.mockResolvedValue({
      ...finalEval,
      populate: jest.fn().mockResolvedValue(finalEval),
    });

    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({ projectId: 'proj1', evaluationType: 'individual', studentId: 'stud456', marks: 85 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('forbids student from evaluating', async () => {
    mockFindByIdForAuth(STUDENT);

    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ projectId: 'proj1', evaluationType: 'individual', studentId: 'stud456', marks: 85 });
    expect(res.status).toBe(403);
  });
});

// ---- Industry Projects: List ----
describe('GET /api/industry', () => {
  it('returns industry projects for any authenticated user', async () => {
    mockFindByIdForAuth(STUDENT);
    IndustryProject.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      }),
    });

    const res = await request(app)
      .get('/api/industry')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ---- Industry Projects: Create ----
describe('POST /api/industry', () => {
  it('allows professor to post an industry project', async () => {
    mockFindByIdForAuth(PROFESSOR);
    const mockProject = {
      _id: 'ip1', title: 'AI Research', status: 'open',
      populate: jest.fn().mockResolvedValue({ _id: 'ip1', title: 'AI Research' }),
    };
    IndustryProject.create.mockResolvedValue(mockProject);

    const res = await request(app)
      .post('/api/industry')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({ title: 'AI Research', description: 'Cutting edge AI work', company: 'TechCorp' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('forbids student from creating an industry project', async () => {
    mockFindByIdForAuth(STUDENT);

    const res = await request(app)
      .post('/api/industry')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ title: 'My Project', description: 'Test', company: 'Me Inc' });
    expect(res.status).toBe(403);
  });
});

// ---- Industry Projects: Apply ----
describe('POST /api/industry/:id/apply', () => {
  it('allows student to apply to an industry project', async () => {
    mockFindByIdForAuth(STUDENT);
    IndustryProject.findById.mockResolvedValue({ _id: 'ip1', status: 'open' });
    Application.findOne.mockResolvedValue(null);
    const mockApp = {
      _id: 'app1', status: 'pending',
      populate: jest.fn().mockResolvedValue({ _id: 'app1', status: 'pending' }),
    };
    Application.create.mockResolvedValue(mockApp);
    IndustryProject.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post('/api/industry/ip1/apply')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ coverLetter: 'I am interested.' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('prevents duplicate applications', async () => {
    mockFindByIdForAuth(STUDENT);
    IndustryProject.findById.mockResolvedValue({ _id: 'ip1', status: 'open' });
    Application.findOne.mockResolvedValue({ _id: 'existing' });

    const res = await request(app)
      .post('/api/industry/ip1/apply')
      .set('Authorization', `Bearer ${makeToken(STUDENT)}`)
      .send({ coverLetter: 'I am interested again.' });
    expect(res.status).toBe(400);
  });
});

// ---- Projects: Team size enforcement ----
describe('POST /api/projects (team size fields)', () => {
  it('creates a project with minTeamSize and maxTeamSize', async () => {
    mockFindByIdForAuth(PROFESSOR);
    Project.create.mockResolvedValue({
      _id: 'proj2', title: 'Big Project', inviteCode: 'BIGPR',
      minTeamSize: 2, maxTeamSize: 4,
    });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${makeToken(PROFESSOR)}`)
      .send({
        title: 'Big Project', description: 'Desc', course: 'CS201',
        semester: 'Spring 2026',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        minTeamSize: 2,
        maxTeamSize: 4,
      });
    expect(res.status).toBe(201);
    expect(res.body.project.minTeamSize).toBe(2);
    expect(res.body.project.maxTeamSize).toBe(4);
  });
});
