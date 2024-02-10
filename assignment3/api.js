const axios = require('axios');
const OPENWEATHER_KEY = "75ae233af45a22eadf235214a7ab9d18";

async function getWeatherByCity(city) {
    let response, responseData = null;
    try {
        response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=en&appid=${OPENWEATHER_KEY}`);
        responseData = response?.data;
    } catch {
        return null;
    }

    if (!responseData) {
        return null;
    }
    
    if (responseData.cod !== 200) {
        return null;
    }

    return {
        "latitude": responseData.coord.lat,
        "longitude": responseData.coord.lon,
        "description": responseData.weather[0].description,
        "temperature": Math.floor(responseData.main.temp),
        "feels_like": responseData.main.feels_like,
        "pressure": responseData.main.pressure,
        "maximum_temperature": Math.floor(responseData.main.temp_max),
        "minimum_temperature": Math.floor(responseData.main.temp_min),
        "humidity": responseData.main.humidity,
        "wind_speed": responseData.wind.speed,
        "wind_deg": responseData.wind.deg,
        "cloudiness": responseData.clouds.all,
        "sunrise": new Date(responseData.sys.sunrise * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        "sunset": new Date(responseData.sys.sunset * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        "name"  : responseData.name,
        "country" : responseData.sys.country
    };
}

exports.getWeatherByCity = getWeatherByCity;
