const express = require('express');
const app = express();
const axios = require('axios');
const StatsD = require('hot-shots');

const stats = new StatsD(
    {
        host: "graphite",
        port: 8125,
    }
);


// endpoint ping
app.get('/ping', (req, res) => {
    res.status(200).send('pong')
    });

app.get('/dictionary', async (req, res) => {
    const endpoint_start = Date.now();
    try{
        const api_start = Date.now();
    const response = await axios({
        method: 'get',
        url: `https://api.dictionaryapi.dev/api/v2/entries/en_US/${req.query.word}`
    })
    const api_time = Date.now() - api_start;
    stats.timing('api.dictionaryapi.dev', api_time);
    const data = [
        {
            phonetics: response.data[0].phonetics,
            meanings: response.data[0].meanings
        }
    ]
    console.log(response.data[0].phonetics)
    res.status(200).send(data)
    }   
    catch(error){
        res.status(500).send('An error occurred')
    }
    const endpoint_time = Date.now() - endpoint_start;
    stats.timing('dictionary', endpoint_time);
    });

app.get('/spaceflight_news', async (req, res) => {
    try{
        const response = await axios({
            method: 'get',
            url: 'https://api.spaceflightnewsapi.net/v4/articles'
        })
        const data = response.data.results.slice(0, 5).map((article) => {
            return(
                article.title
            )
        })
        res.status(200).send(data)

    }
    catch(error){
        res.status(500).send('An error occurred')
    }
});

app.get('/quote', async (req, res) => {
    try{
        const response = await axios({
            method: 'get',
            url: 'https://api.quotable.io/random'
        })
        const data = [
            {
                content: response.data.content,
                author: response.data.author
            }
        ]
        res.status(200).send(data)
    }
    catch(error){
        res.status(500).send('An error occurred')
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    })