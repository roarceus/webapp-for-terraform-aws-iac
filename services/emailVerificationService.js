const { sequelize } = require('../models/dbConnection');
const User = require('../models/userModel');
const EmailVerification = require('../models/emailVerificationModel');
const metricsService = require('../services/metricsService');
const logger = require('../middlewares/loggerMiddleware');

const verifyEmail = async (email, token) => {
    const startTime = Date.now();

    const t = await sequelize.transaction();

    try {
        const user = await User.findOne({ where: { email }, transaction: t });

        if (!user) {
            throw new Error('User not found');
        }

        const verification = await EmailVerification.findOne({
            where: {
                user_id: user.id,
                email: user.email,
                token
            },
            transaction: t
        });

        if (!verification) {
            throw new Error('Invalid verification token');
        }

        if (verification.is_verified) {
            throw new Error('User is already verified');
        }

        if (new Date() > verification.expires_at) {
            throw new Error('Verification link has expired');
        }

        verification.is_verified = true;
        await verification.save({ transaction: t });

        await t.commit();

        metricsService.recordDbQueryTime('verifyEmail', startTime);
        logger.info(`User verified: ${user.id}`);

        return 'Email verified successfully';
    } catch (error) {
        await t.rollback();
        metricsService.recordDbQueryTime('verifyEmail', startTime);
        throw error;
    }
};

module.exports = { verifyEmail };
