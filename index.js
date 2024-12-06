const express = require('express');
const dotenv = require('dotenv');
const healthCheckRoutes = require('./routes/healthCheckRoute');
const userRoutes = require('./routes/userRoutes');
const emailVerificationRoutes = require('./routes/emailVerificationRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/healthz', healthCheckRoutes); // Health check route
app.use('/v1', userRoutes); // User routes
app.use('/v2', userRoutes); // User routes
app.use('/verify', emailVerificationRoutes); // Email Verification routes

module.exports = app;
