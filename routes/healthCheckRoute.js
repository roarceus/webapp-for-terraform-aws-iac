const express = require('express');
const router = express.Router();
const healthCheckController = require('../controllers/healthCheckController');

// GET endpoint
router.get('/healthz', healthCheckController.healthCheck);

// All other endpoints
router.all('/healthz', (req, res) => {
    return res.status(405).send();  // Method Not Allowed
});

module.exports = router;
