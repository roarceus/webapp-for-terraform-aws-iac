const request = require('supertest');
const app = require('../index'); 
const User = require('../models/userModel');
const EmailVerification = require('../models/emailVerificationModel');
const dbHealthService = require('../services/dbHealthService');
const AWS = require('aws-sdk');
const sns = require('aws-sdk/clients/sns');

jest.mock('aws-sdk', () => {
    const mockSNS = {
        publish: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({}),
        }),
    };

    const mockS3 = {
        upload: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({ Location: 'https://mock-s3-url.com/object-key' }),
        }),
        getObject: jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue({ Body: Buffer.from('mock data') }),
        }),
    };

    return {
        SNS: jest.fn(() => mockSNS),
        S3: jest.fn(() => mockS3),
        config: {
            update: jest.fn(),
        },
    };
});


jest.mock('../models/emailVerificationModel');

describe('POST - /v1/user', () => {
    const validUserData = {
        email: 'john.doe@gmail.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
    };

    beforeEach(() => {
        sns.prototype.publish = jest.fn().mockReturnValue({
            promise: jest.fn().mockResolvedValue(),
        });
    
        EmailVerification.create = jest.fn().mockResolvedValue({});
    });
    

    afterEach(async () => {
        await User.destroy({ where: {} }); // Clear all records in the users table
    });

    test('Create user success - 201', async () => {
        const response = await request(app).post('/v1/user').send(validUserData);
        expect(response.status).toBe(201);

        const user = await User.findOne({ where: { email: validUserData.email } });
        expect(user).not.toBeNull();
        expect(user.first_name).toBe(validUserData.first_name);
    });

    test('User with same email address - 400', async () => {
        await request(app).post('/v1/user').send(validUserData);
        const response = await request(app).post('/v1/user').send(validUserData);

        expect(response.status).toBe(400);
    });

    test('Empty body – 400', async () => {
        const response = await request(app).post('/v1/user').send({});

        expect(response.status).toBe(400);
    });

    test('Query parameter present – 400', async () => {
        const response = await request(app)
            .post('/v1/user?extraParam=something')
            .send(validUserData);

        expect(response.status).toBe(400);
    });

    test('first_name or last_name or email or password key or value not present – 400', async () => {
        const response = await request(app).post('/v1/user').send({
            password: 'newpassword123',
        });

        expect(response.status).toBe(400);
    });

    test('/v1/user – GET, PUT, PATCH, DELETE, HEAD, OPTIONS – 405', async () => {
        const methodsWithoutBody = ['get', 'delete', 'head', 'options'];
        const methodsWithBody = ['put', 'patch'];

        for (const method of methodsWithoutBody) {
            const response = await request(app)[method]('/v1/user');
            expect(response.status).toBe(405);
        }

        for (const method of methodsWithBody) {
            const response = await request(app)[method]('/v1/user').send(validUserData);
            expect(response.status).toBe(405);
        }
    });

    test('Database connection not healthy - 503', async () => {
        jest.spyOn(dbHealthService, 'checkDBConnection').mockResolvedValue(false);
        const response = await request(app).post('/v1/user').send(validUserData);
        expect(response.status).toBe(503);
    });
});

describe('PUT and GET - /v1/user/self', () => {
    const validUserData = {
        first_name: 'John',
        last_name: 'Doe',
        password: 'password123',
    };

    test('/v1/user/self – GET, PUT, PATCH, DELETE, HEAD, OPTIONS – 405', async () => {
        const methodsWithoutBody = ['delete', 'head', 'options'];
        const methodsWithBody = ['post', 'patch'];

        for (const method of methodsWithoutBody) {
            const response = await request(app)[method]('/v1/user/self');
            expect(response.status).toBe(405);
        }

        for (const method of methodsWithBody) {
            const response = await request(app)[method]('/v1/user/self').send(validUserData);
            expect(response.status).toBe(405);
        }
    });
});
