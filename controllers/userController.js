const dbHealthService = require('../services/dbHealthService');
const { createUser, getUserInfo, updateUser, addProfilePic, getProfilePic, deleteProfilePic } = require('../services/userService');
const metricsService = require('../services/metricsService');
const logger = require('../middlewares/loggerMiddleware');

// Create a new user
const createUserController = async (req, res) => {
    metricsService.incrementApiCount('createUser');
    const startTime = Date.now();

    const { first_name, last_name, email, password } = req.body;
    try {
        const isDBHealthy = await dbHealthService.checkDBConnection();
        if (isDBHealthy) {
            if (Object.keys(req.query).length > 0) {
            logger.warn('Query parameters are not allowed in createUser');
            return res.status(400).json({ message: 'Query parameters are not allowed.' });
            }
            const newUser = await createUser({ first_name, last_name, email, password });
            logger.info('User created successfully');
            metricsService.recordApiTime('createUser', startTime);
            return res.status(201).json({ message: 'User created successfully.' });
        } else {
            logger.error('Database health check failed');
            return res.status(503).json({ message: 'Service Unavailable.' });
            }
    } catch (error) {
        logger.error(`Error in createUser: ${error.message}`);
        metricsService.recordApiTime('createUser', startTime);
        if (error.message === 'User already exists.') {
            return res.status(400).json({ message: 'User already exists.' });
        } else if (error.message.includes('Invalid first name')) {
            return res.status(400).json({ message: 'Invalid first name. Only letters are allowed with no spaces or special characters.' });
        } else if (error.message.includes('Invalid last name')) {
            return res.status(400).json({ message: 'Invalid last name. Only letters are allowed with no spaces or special characters.' });
        } else if (error.message.includes('Invalid email')) {
            return res.status(400).json({ message: 'Invalid email. Please provide a valid email address.' });
        } else if (error.message.includes('Invalid password')) {
            return res.status(400).json({ message: 'Invalid password. Empty password or passwords with blank characters are not allowed.' });
        } else if (error.message.includes('required')) {
            return res.status(400).json({ message: 'Enter all the required fields - first_name, last_name, email, and password.' });
        }
    }
};

// Get user information
const getUserInfoController = async (req, res) => {
    metricsService.incrementApiCount('getUserInfo');
    const startTime = Date.now();

    try {
        const isDBHealthy = await dbHealthService.checkDBConnection();
        if (isDBHealthy) {
            if (req.headers['content-length'] > 0 || Object.keys(req.query).length > 0) {
                logger.warn('Query parameters or body are not allowed in getUserInfo');
                return res.status(400).json({ message: 'Query parameters or body are not allowed.' });
            }
            const userInfo = await getUserInfo(req.user);
            logger.info('User info retrieved successfully');
            metricsService.recordApiTime('getUserInfo', startTime);
            return res.status(200).json(userInfo);
        } else {
            logger.error('Database health check failed');
            return res.status(503).json({ message: 'Service Unavailable.' });
        }
    } catch (error) {
        logger.error(`Error in getUserInfo: ${error.message}`);
        metricsService.recordApiTime('getUserInfo', startTime);
        return res.status(400).json({ message: error.message });
    }
};

// Update user information
const updateUserController = async (req, res) => {
    metricsService.incrementApiCount('updateUser');
    const startTime = Date.now();

    const updateFields = Object.keys(req.body);

    try {
        const isDBHealthy = await dbHealthService.checkDBConnection();
        if (isDBHealthy) {
            if (Object.keys(req.query).length > 0) {
                logger.warn('Query parameters are not allowed in updateUser');
                return res.status(400).json({ message: 'Query parameters are not allowed.' });
            }
            const updatedUser = await updateUser(req.user, req.body);
            logger.info('User updated successfully');
            metricsService.recordApiTime('updateUser', startTime);
            return res.status(204).send();
        } else {
            logger.error('Database health check failed');
            return res.status(503).json({ message: 'Service Unavailable.' });
        }
    } catch (error) {
        logger.error(`Error in updateUser: ${error.message}`);
        metricsService.recordApiTime('updateUser', startTime);
        if (error.message.includes('Invalid first name')) {
            return res.status(400).json({ message: 'Invalid first name. Only letters are allowed with no spaces or special characters.' });
        } else if (error.message.includes('Invalid last name')) {
            return res.status(400).json({ message: 'Invalid last name. Only letters are allowed with no spaces or special characters.' });
        } else if (error.message.includes('Invalid password')) {
            return res.status(400).json({ message: 'Invalid password. Empty password or passwords with blank characters are not allowed.' });
        } else if (error.message.includes('Invalid field')) {
            return res.status(400).json({ message: `Invalid field(s): ${error.message.split(' - ')[1]}` });
        } else if (error.message.includes('required')) {
            return res.status(400).json({ message: 'Enter any of the required fields - first_name, last_name, or password.' });
        }
    }
};

// Add profile picture
const addProfilePicController = async (req, res) => {
    metricsService.incrementApiCount('addProfilePic');
    const startTime = Date.now();

    try {

        if (Object.keys(req.query).length > 0) {
            logger.warn('Query parameters are not allowed in addProfilePic');
            return res.status(400).json({ message: 'Query parameters are not allowed.' });
        }

        if (!req.file) {
            logger.warn('No file provided in addProfilePic');
            return res.status(400).json({ message: "No file provided. Please attach an image file." });
        }

        if (req.files && req.files.length > 1) {
            logger.warn('Multiple files provided in addProfilePic');
            return res.status(400).json({ message: "Only one file is allowed." });
        }

        const profilePic = await addProfilePic(req.user, req.file);
        logger.info('Profile picture added successfully');
        metricsService.recordApiTime('addProfilePic', startTime);
        return res.status(201).json({
            file_name: profilePic.file_name,
            id: profilePic.id,
            url: profilePic.url,
            upload_date: profilePic.upload_date,
            user_id: profilePic.user_id
        });
    } catch (error) {
        logger.error(`Error in addProfilePic: ${error.message}`);
        metricsService.recordApiTime('addProfilePic', startTime);
        if (error.message.includes('Invalid file format')) {
            return res.status(400).json({ message: "Invalid file format. Supported formats are jpg, jpeg, and png." });
        } else if (error.message.includes('Profile picture already exists')) {
            return res.status(400).json({ message: "Profile picture already exists. Please delete the existing profile picture first." });
        }
        return res.status(503).json({ message: 'Failed to add profile picture.' });
    }
};

// Get profile picture
const getProfilePicController = async (req, res) => {
    metricsService.incrementApiCount('getProfilePic');
    const startTime = Date.now();
    try {
        if (req.headers['content-length'] > 0 || Object.keys(req.query).length > 0) {
            logger.warn('Query parameters or body are not allowed in getProfilePic');
            return res.status(400).json({ message: 'Query parameters or body are not allowed.' });
        }
        const profilePic = await getProfilePic(req.user);
        logger.info('Profile picture retrieved successfully');
        metricsService.recordApiTime('getProfilePic', startTime);
        return res.status(200).json({
            file_name: profilePic.file_name,
            id: profilePic.id,
            url: profilePic.url,
            upload_date: profilePic.upload_date,
            user_id: profilePic.user_id
        });
    } catch (error) {
        logger.error(`Error in getProfilePic: ${error.message}`);
        metricsService.recordApiTime('getProfilePic', startTime);
        if (error.message.includes('picture not found')) {
            return res.status(404).json({ message: 'Profile picture not found.' });
        }
        return res.status(503).json({ message: 'Failed to retrieve profile picture.' });
    }
};

// Delete profile picture
const deleteProfilePicController = async (req, res) => {
    metricsService.incrementApiCount('deleteProfilePic');
    const startTime = Date.now();

    try {
        if (req.headers['content-length'] > 0 || Object.keys(req.query).length > 0) {
            logger.warn('Query parameters or body are not allowed in deleteProfilePic');
            return res.status(400).json({ message: 'Query parameters or body are not allowed.' });
        }
        await deleteProfilePic(req.user);
        logger.info('Profile picture deleted successfully');
        metricsService.recordApiTime('deleteProfilePic', startTime);
        return res.status(204).send();
    } catch (error) {
        logger.error(`Error in deleteProfilePic: ${error.message}`);
        metricsService.recordApiTime('deleteProfilePic', startTime);
        if (error.message.includes('picture not found')) {
            return res.status(404).json({ message: 'Profile picture not found.' });
        }
        return res.status(503).json({ message: 'Failed to delete profile picture.' });
    }
};

module.exports = { createUserController, getUserInfoController, updateUserController, addProfilePicController, getProfilePicController, deleteProfilePicController };
