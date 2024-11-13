const { sequelize } = require('../models/dbConnection');

const checkDBConnection = async () => {
    try {
        await sequelize.authenticate();
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = { checkDBConnection };
