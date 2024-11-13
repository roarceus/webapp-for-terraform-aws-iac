const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer();

// Create user (public)
router.post('/user', userController.createUserController);

// Unsupported methods
router.all('/user', (req, res) => {
    return res.status(405).send();  
});

// Explicitly allow HEAD to return 405 status
router.head('/user/self', (req, res) => {
    return res.status(405).send();
});

router.head('/user/self/pic', (req, res) => {
    return res.status(405).send();
});

// Get user information (authenticated)
router.get('/user/self', authenticateUser, userController.getUserInfoController);

// Update user information (authenticated)
router.put('/user/self', authenticateUser, userController.updateUserController);

// Unsupported methods
router.all('/user/self', (req, res) => {
    return res.status(405).send();  
});

// Upload profile picture (authenticated)
router.post('/user/self/pic', authenticateUser, upload.single('profilePic'), userController.addProfilePicController);

// Get profile picture (authenticated)
router.get('/user/self/pic', authenticateUser, userController.getProfilePicController);

// Delete profile picture (authenticated)
router.delete('/user/self/pic', authenticateUser, userController.deleteProfilePicController);

// Unsupported methods
router.all('/user/self/pic', (req, res) => {
    return res.status(405).send();  
});

module.exports = router;
