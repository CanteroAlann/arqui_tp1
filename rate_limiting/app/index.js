const express = require('express');
const app = express();
const axios = require('axios');

const rateLimit = require('express-rate-limit');
const StatsD = require('hot-shots');
const middleware = require('./middleware/middleware');

const stats = new StatsD(
    {
        host: "graphite",
        port: 8125,
    }
);


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 300, // limit each IP to 300 requests per windowMs
    message: 'Too many requests, please try again later'
});


app.use(limiter);


// endpoint ping
app.get('/ping', (req, res) => {
    const endpoint_start = Date.now();
    res.status(200).send('pong')
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});


app.get('/dictionary', async (req, res, next) => {

    const endpoint_start = Date.now();
    const api_start = Date.now();
    try {
        const response = await axios({
            method: 'get',
            url: `https://api.dictionaryapi.dev/api/v2/entries/en_US/${req.query.word}`
        })
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);
        const data = [
            {
                phonetics: response.data[0].phonetics,
                meanings: response.data[0].meanings
            }
        ]
        res.status(200).send(data)
    }
    catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);

        next(error)
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});

app.get('/spaceflight_news', async (req, res, next) => {

    const endpoint_start = Date.now();
    const api_start = Date.now();
    try {
        const response = await axios({
            method: 'get',
            url: 'https://api.spaceflightnewsapi.net/v4/articles'
        })
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);
        const data = response.data.results.slice(0, 5).map((article) => {
            return (
                article.title
            )
        })
        res.status(200).send(data)

    }
    catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);

        next(error)

    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});


app.get('/quote', async (req, res, next) => {

    const endpoint_start = Date.now();
    const api_start = Date.now();
    try {
        const response = await axios({
            method: 'get',
            url: 'https://api.quotable.io/random'
        })
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);

        const data = [
            {
                content: response.data.content,
                author: response.data.author
            }
        ]
        res.status(200).send(data)
    }
    catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);

        next(error)

    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});

app.use(middleware.errorHandler);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})