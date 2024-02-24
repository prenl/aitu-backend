const mongoose = require('mongoose');

// Connection to mongo cloud database
mongoose.connect('mongodb+srv://prenl:elnur2005@cluster0.yourw5a.mongodb.net/aitu-backend').then(() => console.log('Connected!'));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// User model
const User = new Schema({
    username: String,
    password: String,
    email: String,
    created_at: Date,
    updated_at: Date,
    is_admin: Boolean
});

const UserModel = mongoose.model('User', User);

// Logs model
const Logs = new Schema({
    user: ObjectId,
    request_type: String,
    request_data: String,
    status_code: String,
    timestamp: Date,
    response_data: String
});

const LogsModel = mongoose.model('Logs', Logs);

// Exports
module.exports = {
    UserModel,
    LogsModel
};