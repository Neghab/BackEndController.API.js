const configureExpressInstance = require('../config/express') // Link to your server file
const supertest = require('supertest')
const middlwares = require('../config/middlewares');
const SplunkLogger = require('splunk-logging').Logger;

const { CarvanaJWT } = require('../services')
jest.genMockFromModule('splunk-logging')
jest.mock('splunk-logging')

const mockSplunkMiddleware = {
    splunk: jest.fn()
};

SplunkLogger.mockImplementation(() => mockSplunkMiddleware);

const instanceServices = configureExpressInstance({ CarvanaJWT });

const { appServices: { expressInstance } } = instanceServices;

const request = supertest(expressInstance)

describe('Express Server, middleware and route tests', () => {

    afterAll((done) => {
        expressInstance.resetMocked();
        done();
    });

    test('LIVENESS - Should Make GET request and return statusCode 200', async () => {
        const response = await request.get('/api/v1/liveness');
        expect(response.statusCode).toBe(200);
    });

    test('READINESS - Should Make GET request and return statusCode 200', async () => {
        const response = await request.get('/api/v1/readiness');
        expect(response.statusCode).toBe(200);
    });

    test('PROTECTED - Should Make POST request and return statusCode 401', async () => {
        const response = await request.post('/api/protected');
        expect(response.statusCode).toBe(401);
    });

    test('ADMIN - Should Make GET request and return statusCode 401', async () => {
        const response = await request.get('/api/admin');
        expect(response.statusCode).toBe(401);
    });

    test('SWAGGER - Should Make GET request and return statusCode 200', async () => {
        const response = await request.get('/api/swagger/');
        expect(response.statusCode).toBe(200);
    });
})

