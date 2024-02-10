const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const YANDEX_API_KEY = "";
const WEATHER_API_KEY = "";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('pages/index.ejs', { activePage: "dashboard", user: null });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
