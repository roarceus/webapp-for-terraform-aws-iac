const basicAuth = require('basic-auth');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const dbHealthService = require('../services/dbHealthService');
const logger = require('../middlewares/loggerMiddleware');

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

module.exports = { authenticateUser };
