const basicAuth = require('basic-auth');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const EmailVerification = require('../models/emailVerificationModel');
const dbHealthService = require('../services/dbHealthService');
const logger = require('../middlewares/loggerMiddleware');

// Middleware to authenticate the user
const authenticateUser = async (req, res, next) => {
    const userCredentials = basicAuth(req);
    if (!userCredentials) {
        logger.error('Authentication failed because of invalid user credentials');
        return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, pass } = userCredentials;
    
    try {
        // Check if the database is healthy
        const isDBHealthy = await dbHealthService.checkDBConnection();
        if (!isDBHealthy) {
            logger.error('Service unavailable');
            return res.status(503).json({ message: 'Service Unavailable' });
        }

        const user = await User.findOne({ where: { email: name } });
        if (!user) {
            logger.error('User not found');
            return res.status(401).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) {
            logger.error('Authentication failed because of wrong password');
            return res.status(401).json({ message: 'Wrong password' });
        }

        // Authenticated user is attached to the request object
        req.user = user;
        next();
    } catch (error) {
        logger.error('Service unavailable');
        return res.status(503).json({ message: 'Service Unavailable' });
    }
};

// Middleware to check if the user's email is verified
const checkEmailVerification = async (req, res, next) => {
    const userId = req.user.id;

    try {
        const verification = await EmailVerification.findOne({
            where: { user_id: userId }
        });

        // If no verification record exists
        if (!verification) {
            logger.error(`No verification record found for user ${userId}`);
            return res.status(403).json({
                message: 'Your email is not verified. Please verify your email before proceeding.'
            });
        }

        // If verification exists but is not verified and is expired
        if (!verification.is_verified && new Date() > new Date(verification.expires_at)) {
            logger.error(`Expired verification for user ${userId}`);
            return res.status(403).json({
                message: 'Your email verification has expired. Please request a new verification email.'
            });
        }

        // If verification exists but is not verified (and not expired)
        if (!verification.is_verified) {
            logger.error(`Unverified email for user ${userId}`);
            return res.status(403).json({
                message: 'Your email is not verified. Please verify your email before proceeding.'
            });
        }

        next();
    } catch (error) {
        logger.error('Email verification check failed', error);
        return res.status(503).json({ message: 'Server error.' });
    }
};

module.exports = { authenticateUser, checkEmailVerification };
