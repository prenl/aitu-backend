const axios = require('axios');
const NEWSAPI_KEY = "67a14609965043f8a11737304bb37d60";
const NINJAAPI_KEY = "cvRkvydztNnfIhgxg67S1A==QWedcyKadbq6raQl";

async function getNewsByCity() {
    let response, responseData = null;

    try {
        response = await axios.get(`https://newsapi.org/v2/everything?q=aircraft&apiKey=${NEWSAPI_KEY}&pageSize=10&page=1`);
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

async function getHelicopterInfo(manufacturer, model) {
    let response, responseData = null;

    try {
        response = await axios.get(`https://api.api-ninjas.com/v1/helicopter?manufacturer=${manufacturer}&model=${model}`, {
            headers: {
                'X-Api-Key': NINJAAPI_KEY
            }
        });

        responseData = response?.data;
    } catch (error) {
        return null;
    }

    return responseData[0];
}


module.exports = {
    getNewsByCity, getAircraftInfo, getHelicopterInfo
};
