const axios = require('axios');
const OPENWEATHER_KEY = "75ae233af45a22eadf235214a7ab9d18";
const NEWSAPI_KEY = "67a14609965043f8a11737304bb37d60";
const NINJAAPI_KEY = "cvRkvydztNnfIhgxg67S1A==QWedcyKadbq6raQl";

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

async function getNewsByCity() {
    let response, responseData = null;

    try {
        response = await axios.get(`https://newsapi.org/v2/everything?q=weather&apiKey=${NEWSAPI_KEY}&pageSize=10&page=1`);
        responseData = response?.data?.articles;
    } catch {
        return null;
    }

    let answer = [];

    responseData.forEach(article => {
        answer.push({
            "source": article.source.name,
            "title": article.title,
            "description": article.description,
            "url": article.url,
            "image": article.urlToImage,
            "published_at": new Date(article.publishedAt).toLocaleString('en-GB', { 
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric', hour12: false
            })
        });
    });

    return answer;
}

async function getAircraftInfo(manufacturer, model) {
    let response, responseData = null;
    try {
        response = await axios.get(`https://api.api-ninjas.com/v1/aircraft?manufacturer=${manufacturer}&model=${model}`, {
            headers: {
                'X-Api-Key': NINJAAPI_KEY
            }
        });

        responseData = response?.data;
    } catch {
        return null;
    }
    
    return responseData[0];
}

module.exports = {
    getWeatherByCity, getNewsByCity, getAircraftInfo
};
