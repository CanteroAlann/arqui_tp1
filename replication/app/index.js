const express = require('express');
const app = express();
const axios = require('axios');


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
    res.status(200).send(data)
    }   
    catch(error){
        res.status(500).send('An error occurred')
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
    }
});

app.get('/quote', async (req, res) => {
    try{
        const response = await axios({
            method: 'get',
            url: 'https://api.quotable.io/random'
        })
        const data = response.data.content
        res.status(200).send(data)
    }
    catch(error){
        res.status(500).send('An error occurred')
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    })