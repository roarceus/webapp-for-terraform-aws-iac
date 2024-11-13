const express = require('express');
const dotenv = require('dotenv');
const healthCheckRoutes = require('./routes/healthCheckRoute');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/', healthCheckRoutes); // Health check route
app.use('/v1', userRoutes); // User routes

module.exports = app;
