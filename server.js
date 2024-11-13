const app = require('./index.js');
const port = process.env.PORT || 8080;
const { connectToDB, sequelize } = require('./models/dbConnection');

const startServer = async () => {
    try {
        await connectToDB();
        await sequelize.sync();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting the server:', error);
    }
};

startServer();
