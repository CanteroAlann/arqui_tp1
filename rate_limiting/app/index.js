const express = require('express');
const app = express();
const axios = require('axios');

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit : 100, // limit each IP to 50 requests per windowMs
    message: 'Too many requests, please try again later'
    });


app.use(limiter);


// endpoint ping
app.get('/ping', (req, res) => {
    res.status(200).send('pong')
    });

app.get('/dictionary', async (req, res) => {
    try{
    const response = await axios({
        method: 'get',
        url: `https://api.dictionaryapi.dev/api/v2/entries/en_US/${req.query.word}`
    })
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
        console.log(error)
    }
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
        console.log(error)
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
        console.log(error)
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    })