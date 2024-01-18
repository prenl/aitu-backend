const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/coordinates", async (req, res) => {
    try {
        const response = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
                req.query.search
            )}&apiKey=39bf8df9317f48bc822123c7b2419c96`
        );

        const result = await response.json();

        if (result.features && result.features.length > 0) {
            res.json({ lat: result.features[0].properties.lat, lon: result.features[0].properties.lon });
        } else {
            res.status(404);
        }
    } catch (error) {
        console.error("error", error);
        res.status(500).send("error");
    }
});

app.get("/api/weather", async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const long = parseFloat(req.query.long);

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=75ae233af45a22eadf235214a7ab9d18`;

    const response = await fetch(url);

    if (response.status !== 200) {
        res.status(response.status).send("error");
        return;
    }

    const data = await response.json();
    const kelvin = 273.15;

    res.json({
        temperature: Math.floor(data.main.temp - kelvin),
        feels_like: Math.floor(data.main.feels_like - kelvin),
        humidity: data.main.humidity,
        temp_min: Math.floor(data.main.temp_min - kelvin),
        temp_max: Math.floor(data.main.temp_max - kelvin),
        pressure: data.main.pressure,
        visibility: data.visibility,
        wind_speed: data.wind.speed,
        wind_deg: data.wind.deg,
        clouds: data.clouds.all,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
        name: data.weather[0].main,
    });
});

app.get("/map", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "map.html"));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// BONUS TASK IS UNREACHABLE DUE TO API PRICES, I made everything I could
