const emailVerificationService = require('../services/emailVerificationService');
const metricsService = require('../services/metricsService');
const logger = require('../middlewares/loggerMiddleware');

const verifyEmailController = async (req, res) => {
    metricsService.incrementApiCount('verify');
    const startTime = Date.now();

    const { email, token, ...extraParams } = req.query;

    if (!email || !token) {
        logger.warn('Email or token not present in the query');
        metricsService.recordApiTime('verify', startTime);
        return res.status(400).json({ message: 'Email and token are required.' });
    }

    // Check if unexpected query parameters are present
    if (Object.keys(extraParams).length > 0) {
        logger.warn('Unexpected query parameters present');
        metricsService.recordApiTime('verify', startTime);
        return res.status(400).json({ message: 'Unexpected query parameters detected.' });
    }

    // Check if body is present
    if (Object.keys(req.body).length > 0) {
        logger.warn('Unexpected request body present');
        metricsService.recordApiTime('verify', startTime);
        return res.status(400).json({ message: 'Request body is not allowed for this endpoint.' });
    }

    try {
        await emailVerificationService.verifyEmail(email, token);
        logger.info('Email verification successful.');
        metricsService.recordApiTime('verify', startTime);
        return res.status(200).json({ 
            message: 'Email verified successfully!',
            verified: true
        });
    } catch (error) {
        logger.error(`Error in verification: ${error.message}`);
        metricsService.recordApiTime('verify', startTime);
        if (error.message.includes('Invalid verification token')) {
            return res.status(400).json({ message: 'Invalid verification token' });
        } else if (error.message.includes('expired')) {
            return res.status(400).json({ message: 'Verification link has expired' });
        } else if (error.message.includes('User not found')) {
            return res.status(400).json({ message: 'User not found' });
        } else if (error.message.includes('already verified')) {
            return res.status(400).json({ message: 'User is already verified' });
        }
        return res.status(503).json({ message: 'Failed to verify email.' });
    }
};

module.exports = { verifyEmailController };
