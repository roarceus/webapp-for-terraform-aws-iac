const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerificationController');

// GET endpoint
router.get('/', emailVerificationController.verifyEmailController);

// All other endpoints
router.all('/', (req, res) => {
    return res.status(405).send();  // Method Not Allowed
});

module.exports = router;
