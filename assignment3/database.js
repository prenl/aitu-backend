const mongoose = require('mongoose');

// Connection to mongo cloud database
mongoose.connect('mongodb+srv://prenl:elnur2005@cluster0.yourw5a.mongodb.net/').then(() => console.log('Connected!'));

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

// Weather logs model
const WeatherLog = new Schema({
    user: ObjectId,
    city: String,
    created_at: Date,
    data: String
});

const WeatherLogModel = mongoose.model('WeatherLog', WeatherLog);

module.exports = {
    UserModel,
    WeatherLogModel
};
