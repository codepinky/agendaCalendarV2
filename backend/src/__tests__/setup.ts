// Setup global mocks and test configuration

// Mock Firebase Admin
jest.mock('../services/firebase', () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

// Mock Google Calendar Service
jest.mock('../services/googleCalendarService', () => ({
  createCalendarEvent: jest.fn(() => Promise.resolve()),
  getAuthUrl: jest.fn(),
  getTokensFromCode: jest.fn(),
  getCalendarId: jest.fn(),
  refreshAccessToken: jest.fn(),
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logSuspiciousActivity: jest.fn(),
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';

