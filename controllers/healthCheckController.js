const dbHealthService = require('../services/dbHealthService');
const metricsService = require('../services/metricsService');
const logger = require('../middlewares/loggerMiddleware');

const healthCheck = async (req, res) => {
    metricsService.incrementApiCount('healthCheck');
    const startTime = Date.now();

    // Check if the method is GET
    if (req.method === 'GET') {
        // Check if there is a payload or query
        if (req.headers['content-length'] > 0 || Object.keys(req.query).length > 0) {
            logger.warn('Bad Request: Payload or query present in health check');
            metricsService.recordApiTime('healthCheck', startTime);
            return res.status(400).send();  // Bad Request
        }

        // Proceed with the health check
        try {
            const isDBHealthy = await dbHealthService.checkDBConnection();
            if (isDBHealthy) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                logger.info('Health check successful');
                metricsService.recordApiTime('healthCheck', startTime);
                return res.status(200).send();  // OK
            } else {
                logger.error('Health check failed: Database unavailable');
                metricsService.recordApiTime('healthCheck', startTime);
                return res.status(503).send();  // Service Unavailable
            }
        } catch (error) {
            logger.error(`Health check error: ${error.message}`);
            metricsService.recordApiTime('healthCheck', startTime);
            return res.status(503).send();  // Service Unavailable
        }
    } else {
        logger.warn(`Method Not Allowed: ${req.method}`);
        metricsService.recordApiTime('healthCheck', startTime);
        return res.status(405).send();  // Method Not Allowed
    }
};

module.exports = { healthCheck };
