const { DataTypes } = require('sequelize');
const { sequelize } = require('./dbConnection');

const EmailVerification = sequelize.define('EmailVerification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
        references: {
            model: 'users',
            key: 'email'
        }
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: 'email_verifications',
    timestamps: false,
});

module.exports = EmailVerification;
