const express = require('express');
const router = express.Router();
const healthCheckController = require('../controllers/healthCheckController');

// GET endpoint
router.get('/', healthCheckController.healthCheck);

// All other endpoints
router.all('/', (req, res) => {
    return res.status(405).send();  // Method Not Allowed
});

module.exports = router;
