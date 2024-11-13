const request = require('supertest');
const app = require('../index');
const dbHealthService = require('../services/dbHealthService');

describe('Healthz API', () => {
    // Test for healthy connection
    test('should return 200 OK for healthy system', async () => {
        const response = await request(app).get('/healthz');
        expect(response.status).toBe(200);
    });

    // Test for unhealthy connection
    test('should return 503 if the database connection is not healthy', async () => {
        jest.spyOn(dbHealthService, 'checkDBConnection').mockResolvedValue(false);
        const response = await request(app).get('/healthz');
        expect(response.status).toBe(503);
    });

    // Test for POST
    test('should return 405 if using unsupported method like POST', async () => {
        const response = await request(app).post('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for PUT
    test('should return 405 if using unsupported method like PUT', async () => {
        const response = await request(app).put('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for PATCH
    test('should return 405 if using unsupported method like PATCH', async () => {
        const response = await request(app).patch('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for DELETE
    test('should return 405 if using unsupported method like DELETE', async () => {
        const response = await request(app).delete('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for HEAD
    test('should return 405 if using unsupported method like HEAD', async () => {
        const response = await request(app).head('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for OPTIONS
    test('should return 405 if using unsupported method like OPTIONS', async () => {
        const response = await request(app).options('/healthz');
        expect(response.status).toBe(405);  // Method Not Allowed
    });

    // Test for query parameters
    test('should return 400 if query parameters are present', async () => {
        const response = await request(app).get('/healthz?param=value');
        expect(response.status).toBe(400); // Bad Request
    });

    // Test for request body
    test('should return 400 if body is present', async () => {
        const response = await request(app).get('/healthz').send({ key: 'value' });
        expect(response.status).toBe(400); // Bad Request
    });

    // Test for both query parameters and body
    test('should return 400 if both query parameters and body are present', async () => {
        const response = await request(app).get('/healthz?param=value').send({ key: 'value' });
        expect(response.status).toBe(400); // Bad Request
    });
});
