const express = require('express');
const app = express();
const axios = require('axios');
const redis = require('redis');

const StatsD = require('hot-shots');

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
    stats.gauge('endpoint_time', endpoint_time);
});

app.get('/dictionary', async (req, res) => {
    const endpoint_start = Date.now();
    try {
        const api_start = Date.now();
        const response = await axios({
            method: 'get',
            url: `https://api.dictionaryapi.dev/api/v2/entries/en_US/${req.query.word}`
        })
        const api_time = Date.now() - api_start;
        stats.gauge('external_api_time', api_time);
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
        res.status(500).send('An error occurred')
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.gauge('endpoint_time', endpoint_time);
});

app.get('/spaceflight_news', async (req, res) => {
    const endpoint_start = Date.now();
    try {
        const api_start = Date.now();
        const response = await axios({
            method: 'get',
            url: 'https://api.spaceflightnewsapi.net/v4/articles'
        })
        const api_time = Date.now() - api_start;
        const data = response.data.results.slice(0, 5).map((article) => {
            return (
                article.title
            )
        })
        res.status(200).send(data)
    }
    catch (error) {
        res.status(500).send('An error occurred')
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.gauge('endpoint_time', endpoint_time);
});

app.get('/quote', async (req, res) => {
    const endpoint_start = Date.now();
    try {
        const api_start = Date.now();
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
            const api_time = Date.now() - api_start;
            stats.gauge('external_api_time', api_time);
            return
        }

        const response = await axios({
            method: 'get',
            url: 'https://api.quotable.io/quotes/random?limit=50'
        })
        const api_time = Date.now() - api_start;
        stats.gauge('external_api_time', api_time);

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
        console.log('data from api', dataToSend)
        client.set('quotes', JSON.stringify(dataToStore), (err, reply) => {
            if (err) {
                console.error(err)
            } else {
                console.log('se guardaron los datos', reply)
            }

        })
    }
    catch (error) {
        console.error(error)
        res.status(500).send('An error occurred')
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.gauge('endpoint_time', endpoint_time);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})