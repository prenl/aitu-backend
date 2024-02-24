const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = 3000;

const { UserModel, LogsModel } = require('./database');
const { getWeatherByCity, getNewsByCity, getAircraftInfo } = require('./api');
const { getWindDirection, getCurrentTimeString } = require('./utils');

app.use(session({ secret: 'yelnurabdrakhmanov-se2203', resave: false, saveUninitialized: true, cookie: { secure: !true, maxAge: 3600000 }}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('trust proxy', true)

// Index page
app.get('/', async (req, res) => {
    const user = await getUserInstance(req);

    res.render('pages/index.ejs', { activePage: "home", user: user ? user : null, error: null });
});

// Search page
app.post("/search", async (req, res) => {
    const user = await getUserInstance(req);
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
    const user = await getUserInstance(req);
    res.render('pages/search.ejs', { activePage: "search", user: user, data: null, error: null, city: null });
});

// History page
app.get("/history", ensureAuthenticated, async (req, res) => {
    const user = await getUserInstance(req);
    if (!user) {
        return res.status(303).redirect("/search");
    }

    const logs = await LogsModel.find({ user: user._id }).sort({ _id: -1 }).exec();
    res.render('pages/history.ejs', { activePage: "history", user: user, logs: logs, error: logs ? null : "No logs found"});
});

app.get("/history/:objectId", ensureAuthenticated, async (req, res) => {
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

app.get("/history/:objectId/delete", ensureAuthenticated, async (req, res) => {
    const user = await getUserInstance(req);
    if (!user) {
        return res.status(303).redirect("/search");
    }

    const objectId = req.params.objectId;

    await LogsModel.findByIdAndDelete(objectId).exec();
    res.status(303).redirect("/history");
});

// Admin page
app.get("/admin", ensureAdmin, async (req, res) => {
    const user = await getUserInstance(req);

    if (!user || !user.is_admin) {
        return res.status(303).redirect("/");
    }

    const allUsers = await UserModel.find().exec();

    res.render('pages/admin.ejs', { activePage: "admin", user: user, users: allUsers });
});

app.get("/admin/:userid/delete", ensureAdmin, async (req, res) => {
    const user = await getUserInstance(req);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/");
    }

    const userId = req.params.userid;

    await UserModel.findByIdAndDelete(userId).exec();
    res.status(202).redirect("/admin");
});

app.get("/admin/:userid/makeAdmin", ensureAdmin, async (req, res) => {
    const user = await getUserInstance(req);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/");
    }

    const userId = req.params.userid;

    await UserModel.findByIdAndUpdate(userId, { is_admin: true }).exec();
    res.status(202).redirect("/admin");
});

app.post("/admin/addUser", ensureAdmin, async (req, res) => {
    const { username, email, password, is_admin } = req.body;
    const user = await getUserInstance(req);

    if (!user || !user.is_admin) {
        return res.status(403).redirect("/");
    }

    const userInstance = new UserModel({ username: username, email: email, password: password, is_admin: is_admin === "on" });
    await userInstance.save();

    res.status(202).redirect("/admin");
});

app.get("/admin/:username", ensureAdmin, async (req, res) => {
    const username = req.params.username;
    const s_user = await UserModel.findOne({ username: username }).exec();
    const history = await LogsModel.find({ user: s_user._id }).sort({ _id: -1 }).exec();
    const user = await getUserInstance(req);

    res.render('pages/admin_user.ejs', { activePage: "admin", user: user, s_user: s_user, logs: history, error: history ? null : "No logs found"});
});

app.post('/admin/updateUser', ensureAdmin, async (req, res) => {
    const { userId, username, email, password } = req.body;
    const updated_at = new Date();
    await UserModel.findByIdAndUpdate(userId, { username, email, password, updated_at }).exec();

    res.redirect('/admin');
});


// News page
app.get("/news", async (req, res) => {
    const news = await getNewsByCity();
    const user = await getUserInstance(req);

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
    const user = await getUserInstance(req);

    if (!aircraft) {
        LogsModel.create({ user: user ? user._id : null, request_type: "aircraft", request_data: `${manufacturer} ${model}`, status_code: "404", timestamp: new Date(), response_data: null});
        return res.render('pages/aircraft.ejs', { activePage: "aircraft", user: null, error: "Aircraft was not found :(", data: null, manufacturer: null, model: null });
    }

    res.render('pages/aircraft.ejs', { activePage: "aircraft", user: user, data: aircraft, error: null, manufacturer: aircraft.manufacturer, model: aircraft.model});
    LogsModel.create({ user: user ? user._id : null, request_type: "aircraft", request_data: `${manufacturer} ${model}`, status_code: "200", timestamp: new Date(), response_data: JSON.stringify(aircraft)});
});

app.get("/aircraft", async (req, res) => {
    const user = await getUserInstance(req);
    res.render('pages/aircraft.ejs', { activePage: "aircraft", user: user, error: null, data: null, manufacturer: null, model: null});
});


// Login page
app.get("/login", async (req, res) => {
    const user = await getUserInstance(req);
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

    const match = await bcrypt.compare(password, userInstance.password);
        
    if (!match) {
        LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "401", timestamp: new Date(), response_data: "wrong password"});
        res.render('pages/login.ejs', { activePage: "login", error: "Password is incorrect", user: null });
        return;
    }

    req.session.userId = userInstance._id;
    res.status(303).redirect("/");
    LogsModel.create({ user: userInstance._id, request_type: "login", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Signup page
app.get("/signup", async (req, res) => {
    const user = await getUserInstance(req);
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    userInstance = new UserModel({ username: username, email: email, password: hashedPassword, created_at: new Date(), updated_at: new Date(), is_admin: false});
    await userInstance.save();

    res.status(303).redirect("/login");
    LogsModel.create({ user: userInstance._id, request_type: "signup", request_data: username, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Logout logic
app.get("/logout", ensureAuthenticated, async (req, res) => {
    req.session.destroy();
    res.status(303).redirect("/");
    LogsModel.create({ user: null, request_type: "logout", request_data: null, status_code: "200", timestamp: new Date(), response_data: "success"});
});

// Listening
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on ${port}`);
});


// Utils
async function getUserInstance(req) {
    if (req.session.userId) {
        return await UserModel.findById(req.session.userId).exec();
    }

    return null;
}

// Middleware
async function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }

    res.status(403).redirect("/login");
}

async function ensureAdmin(req, res, next) {
    if (req.session.userId) {
        const user = await UserModel.findById(req.session.userId).exec();
    }

    if (!user) res.status(403).redirect("/");

    if (user?.is_admin) {
        return next();
    }

    res.status(403).redirect("/");
}



    
