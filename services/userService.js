const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const ProfilePic = require('../models/profilePicModel');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const metricsService = require('../services/metricsService');
const logger = require('../middlewares/loggerMiddleware');

const s3 = new AWS.S3();

// Allowed fields for update
const allowedUpdateFields = ['first_name', 'last_name', 'password'];

// Service to create a new user
const createUser = async ({ email, password, first_name, last_name }) => {
    const startTime = Date.now();

    // Regular expressions for validations
    const nameRegex = /^[A-Za-z]+$/; // Only letters (uppercase and lowercase)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format, no spaces
    const passwordRegex = /^\S+$/; // No spaces or tabs

    if (!email || !password || !first_name || !last_name) {
        throw new Error('All fields (email, password, first_name, last_name) are required.');
    }

    // Validate first_name and last_name
    if (!first_name || !nameRegex.test(first_name)) {
        throw new Error('Invalid first name. Only letters are allowed, with no spaces or special characters.');
    }
    if (!last_name || !nameRegex.test(last_name)) {
        throw new Error('Invalid last name. Only letters are allowed, with no spaces or special characters.');
    }

    // Validate email
    if (!email || !emailRegex.test(email)) {
        throw new Error('Invalid email. Please provide a valid email address.');
    }

    // Validate password
    if (!password || !passwordRegex.test(password)) {
        throw new Error('Invalid password. Empty password or passwords with blank characters are not allowed.');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        account_created: new Date(),
        account_updated: new Date(),
    });

    metricsService.recordDbQueryTime('createUser', startTime);
    logger.info(`User created: ${newUser.id}`);

    return newUser;
};

// Service to update user information
const updateUser = async (user, updateData) => {
    const startTime = Date.now();

    const updateFields = Object.keys(updateData);

    // Allowed fields for update
    const allowedUpdateFields = ['first_name', 'last_name', 'password'];

    // Regular expressions for validations
    const nameRegex = /^[A-Za-z]+$/; // Only letters (uppercase and lowercase)
    const passwordRegex = /^\S+$/; // No spaces or tabs

    // Validate that only allowed fields are updated
    const invalidFields = updateFields.filter(field => !allowedUpdateFields.includes(field));
    if (invalidFields.length > 0) {
        throw new Error(`Invalid field(s) - ${invalidFields.join(', ')}`);
    }

    const { first_name, last_name, password } = updateData;
    if (!first_name && !last_name && !password) {
        throw new Error('At least one field (first_name, last_name, password) is required for update.');
    }

    // Validation for first_name and last_name
    if (first_name && !nameRegex.test(first_name)) {
        throw new Error('Invalid first name. Only letters are allowed, with no spaces or special characters.');
    }
    if (last_name && !nameRegex.test(last_name)) {
        throw new Error('Invalid last name. Only letters are allowed, with no spaces or special characters.');
    }

    // Validation for password
    if (password && !passwordRegex.test(password)) {
        throw new Error('Invalid password. Empty password or passwords with blank characters are not allowed.');
    }

    const updatedData = {};
    if (first_name) updatedData.first_name = first_name;
    if (last_name) updatedData.last_name = last_name;
    if (password) updatedData.password = await bcrypt.hash(password, 10);
    updatedData.account_updated = new Date();

    await user.update(updatedData);

    metricsService.recordDbQueryTime('updateUser', startTime);
    logger.info(`User updated: ${user.id}`);

    return user;
};

// Service to get user information
const getUserInfo = async (user) => {
    const startTime = Date.now();

    const userInfo = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        account_created: user.account_created,
        account_updated: user.account_updated,
    };

    metricsService.recordDbQueryTime('getUserInfo', startTime);
    logger.info(`User info retrieved: ${user.id}`);

    return userInfo;
};

// Service to add profile picture
const addProfilePic = async (user, file) => {
    const startTime = Date.now();

    const { originalname, buffer } = file;
    const fileExtension = originalname.split('.').pop().toLowerCase();

    if (!['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        throw new Error('Invalid file format.');
    }

    const existingProfilePic = await ProfilePic.findOne({ where: { user_id: user.id } });
    if (existingProfilePic) {
        throw new Error('Profile picture already exists.');
    }

    const fileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `${user.id}/${fileName}`;
    const uploadDate = new Date();

    await s3.upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: `image/${fileExtension}`
    }).promise();
    metricsService.recordS3OperationTime('uploadProfilePic', startTime);

    // Save metadata to the database
    const profilePic = await ProfilePic.create({
        file_name: fileName,
        url: `${process.env.S3_BUCKET_NAME}/${s3Key}`,
        upload_date: uploadDate,
        user_id: user.id
    });

    metricsService.recordDbQueryTime('addProfilePic', startTime);
    logger.info(`Profile picture added for user: ${user.id}`);

    return profilePic;
};

// Service to get profile picture
const getProfilePic = async (user) => {
    const startTime = Date.now();

    const profilePic = await ProfilePic.findOne({ where: { user_id: user.id } });
    if (!profilePic) throw new Error('Profile picture not found.');

    metricsService.recordDbQueryTime('getProfilePic', startTime);
    logger.info(`Profile picture retrieved for user: ${user.id}`);

    return profilePic;
};

// Service to delete profile picture
const deleteProfilePic = async (user) => {
    const startTime = Date.now();

    const profilePic = await ProfilePic.findOne({ where: { user_id: user.id } });
    if (!profilePic) throw new Error('Profile picture not found.');

    await s3.deleteObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: profilePic.url.split('/').slice(1).join('/')
    }).promise();
    metricsService.recordS3OperationTime('deleteProfilePic', startTime);

    // Delete metadata from the database
    await profilePic.destroy();

    metricsService.recordDbQueryTime('deleteProfilePic', startTime);
    logger.info(`Profile picture deleted for user: ${user.id}`);
};

module.exports = { createUser, updateUser, getUserInfo, addProfilePic, getProfilePic, deleteProfilePic };