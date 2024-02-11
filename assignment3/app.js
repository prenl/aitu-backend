const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { LocalStorage } = require('node-localstorage');
const port = 3000;


const { UserModel, LogsModel } = require('./database');
let localStorage = new LocalStorage('./scratch');
const { getWeatherByCity, getNewsByCity, getAircraftInfo } = require('./api');
const { getWindDirection, getCurrentTimeString } = require('./utils');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Index page
app.get('/', async (req, res) => {
    const user = await getUserInstance();

    res.render('pages/index.ejs', { activePage: "home", user: user ? user : null, error: null });
});

// Search page
app.post("/search", async (req, res) => {
    const user = await getUserInstance();
    const city = req.body.city;

    const weatherData = await getWeatherByCity(city);

    if (!weatherData) {
        LogsModel.create({ user: user ? user._id : null, request_type: "weather", request_data: city, status_code: "404", timestamp: new Date(), response_data: null});
        return res.render('pages/search.ejs', { activePage: "home", user: user ? user : null, error: "City not found", city: null, data: null});
    }

    weatherData.wind_direction = getWindDirection(weatherData.wind_deg);
    weatherData.description = weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1);
    weatherData.time = getCurrentTimeString();

    res.render('pages/search.ejs', { activePage: "search", user: user ? user : null, data: weatherData, city: city, error: null });
    LogsModel.create({ user: user ? user._id : null, request_type: "weather", request_data: city, status_code: "200", timestamp: new Date(), response_data: JSON.stringify(weatherData)});
});

app.get("/search", async (req, res) => {
    const user = await getUserInstance();
    res.render('pages/search.ejs', { activePage: "search", user: user, data: null, error: null, city: null });
});

// History page
app.get("/history", async (req, res) => {
    const user = await getUserInstance();
    if (!user) {
        return res.status(303).redirect("/search");
    }

    const logs = await LogsModel.find({ user: user._id }).sort({ _id: -1 }).exec();
    res.render('pages/history.ejs', { activePage: "history", user: user, logs: logs, error: logs ? null : "No logs found"});
});

app.get("/history/:objectId", async (req, res) => {
    const objectId = req.params.objectId;
    const log = await LogsModel.findById(objectId).exec();
    try {
        if (!log) {
            return res.status(404).send("Log not found");
        }
        
        res.json(JSON.parse(log.response_data));
    } catch (error) {
        res.status(200).json({ data: log.response_data })
    }
});


// Admin page
app.get("/admin", async (req, res) => {
    const user = await getUserInstance();
    if (!user || !user.is_admin) {
        return res.status(303).redirect("/");
    }

    const allUsers = await UserModel.find().exec();

    res.render('pages/admin.ejs', { activePage: "admin", user: user, users: allUsers, error: null });
});

// News page
app.get("/news", async (req, res) => {
    const news = await getNewsByCity();
    const user = await getUserInstance();

    if (!news) {
        return res.render('pages/news.ejs', { activePage: "news", user: user, error: "Could not fetch news", data: null });
    }

    res.render('pages/news.ejs', { activePage: "news", user: user, data: news, error: null });
    LogsModel.create({ user: user ? user._id : null, request_type: "news", request_data: null, status_code: "200", timestamp: new Date(), response_data: JSON.stringify(news)});
});

// Aircraft page
app.post("/aircraft", async (req, res) => {
    const { manufacturer, model } = req.body;
    const aircraft = await getAircraftInfo(manufacturer, model);
    const user = await getUserInstance();

    if (!aircraft) {
        LogsModel.create({ user: user ? user._id : null, request_type: "aircraft", request_data: `${manufacturer} ${model}`, status_code: "404", timestamp: new Date(), response_data: null});
        return res.render('pages/aircraft.ejs', { activePage: "aircraft", user: null, error: "Aircraft was not found :(", data: null, manufacturer: null, model: null });
    }

    res.render('pages/aircraft.ejs', { activePage: "aircraft", user: user, data: aircraft, error: null, manufacturer: aircraft.manufacturer, model: aircraft.model});
    LogsModel.create({ user: user ? user._id : null, request_type: "aircraft", request_data: `${manufacturer} ${model}`, status_code: "200", timestamp: new Date(), response_data: JSON.stringify(aircraft)});
});

app.get("/aircraft", async (req, res) => {
    const user = await getUserInstance();
    res.render('pages/aircraft.ejs', { activePage: "aircraft", user: user, error: null, data: null, manufacturer: null, model: null});
});


// Login page
app.get("/login", async (req, res) => {
    const user = await getUserInstance();
    if (user) {
        return res.status(303).redirect("/");
    }

    res.render('pages/login.ejs', { activePage: "login", error: null, user: null });
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        res.render('pages/login.ejs', { activePage: "login", error: "All fields are required", user: null });
        return;
    }

    let userInstance = await UserModel.findOne({ username: username }).exec();

    if (!userInstance) {
        res.render('pages/login.ejs', { activePage: "login", error: "User does not exist", user: null });
        return;
    } 
        
    if (userInstance.password !== password) {
        LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "401", timestamp: new Date(), response_data: "wrong password"});
        res.render('pages/login.ejs', { activePage: "login", error: "Password is incorrect", user: null });
        return;
    }

    localStorage.setItem("username", username);
    res.status(303).redirect("/");
    LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Signup page
app.get("/signup", async (req, res) => {
    const user = await getUserInstance();
    if (user) {
        return res.status(303).redirect("/");
    }

    res.render('pages/signup.ejs', { activePage: "signup", error: null, user: null });
});

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !email || !password) {
        res.render('pages/signup.ejs', { activePage: "signup", error: "All fields are required", user: null });
        return;
    }

    let userInstance = await UserModel.findOne({ username: username }).exec();

    if (userInstance) {
        res.render('pages/signup.ejs', { activePage: "signup", error: "User already exists", user: null });
        return;
    }

    userInstance = new UserModel({ username: username, email: email, password: password });
    await userInstance.save();

    localStorage.setItem("username", username);
    res.status(303).redirect("/");
    LogsModel.create({ user: userInstance._id, request_type: "signup", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Logout logic
app.get("/logout", async (req, res) => {
    localStorage.clear();
    res.status(303).redirect("/");
    LogsModel.create({ user: null, request_type: "logout", request_data: null, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Listening
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// Utils
async function getUserInstance() {
    const username = localStorage.getItem("username");

    let userInstance = null;
    if (username) {
        userInstance = await UserModel.findOne({ username: username}).exec();
    }

    return userInstance;
}



    
