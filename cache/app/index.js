const express = require('express');
const app = express();
const axios = require('axios');
const redis = require('redis');

const StatsD = require('hot-shots');
const middleware = require('./middleware/middleware');

const stats = new StatsD(
    {
        host: "graphite",
        port: 8125,
    }
);

// redis configuration
const client = redis.createClient(
    { url: 'redis://redis_db:6379' }
);

client.connect();

client.on('error', (error) => {
    console.error(error);
});

client.on('connect', () => {
    console.log('Connected to Redis')
});


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
        console.log(response.data[0].phonetics)
        res.status(200).send(data)
    }
    catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);
        next(error)
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time', endpoint_time);
});

app.get('/spaceflight_news', async (req, res, next) => {
    const endpoint_start = Date.now();
    const api_start = Date.now();
    try {
        let dataToSend = {};
        const fromCache = await client.get('spaceflight_news');
        if (fromCache) {
            console.log('Data from cache')
            const dataFromCache = JSON.parse(fromCache);
            dataToSend = dataFromCache;
            const endpoint_time = Date.now() - endpoint_start;
            stats.timing('endpoint_time_stats', endpoint_time);
            return res.status(200).send(dataToSend);
        } else {
            const response = await axios({
                method: 'get',
                url: 'https://api.spaceflightnewsapi.net/v4/articles/',
                params: {
                    limit: 5,
                    ordering: '-published_at'
                }
            });
            console.log('Data from API');
            const api_time = Date.now() - api_start;
            stats.timing('external_api_time_stats', api_time);
            const data = response.data.results.map((article) => {
                return article.title;
            });
            dataToSend = data;
            res.status(200).send(dataToSend);
            client.set('spaceflight_news', JSON.stringify(dataToSend), {'EX': 600}, (err, reply) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Los datos se guardaron en caché correctamente.', reply);
                }
            });
            
        }
    } catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);
        next(error);
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});


app.get('/quote', async (req, res, next) => {
    const endpoint_start = Date.now();
    const api_start = Date.now();
    try {
        let dataToSend = {}
        const fromCache = await client.get('quotes')
        const dataFromCache = JSON.parse(fromCache)
        if (dataFromCache && dataFromCache.length > 0) {
            dataToSend = dataFromCache.pop()
            client.set('quotes', JSON.stringify(dataFromCache), (err, reply) => {
                if (err) {
                    console.error(err)
                }
                else {
                    console.log('se guardaron los datos', reply)
                }
            })
            res.status(200).send(dataToSend)
            const endpoint_time = Date.now() - endpoint_start;
            stats.timing('endpoint_time_stats', endpoint_time);
            return
        }

        const response = await axios({
            method: 'get',
            url: 'https://api.quotable.io/quotes/random?limit=50'
        })
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);

        const dataToStore = response.data.map((quote) => {
            return {
                quote: quote.content,
                author: quote.author
            }
        })
        const firstQuote = dataToStore.pop()
        dataToSend = {
            quote: firstQuote.quote,
            author: firstQuote.author
        }
        res.status(200).send(dataToSend)
        client.set('quotes', JSON.stringify(dataToStore), (err, reply) => {
            if (err) {
                console.error(err)
            } else {
                console.log('se guardaron los datos', reply)
            }

        })
    }
    catch (error) {
        const api_time = Date.now() - api_start;
        stats.timing('external_api_time_stats', api_time);
        next(error)
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('endpoint_time_stats', endpoint_time);
});
app.use(middleware.errorHandler)
app.listen(3000, () => {
    console.log('Server is running on port 3000');
})