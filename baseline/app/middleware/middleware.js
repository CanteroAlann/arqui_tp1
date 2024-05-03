
const errorHandler = (error, req, res, next) => {
    if (error.response) {
        res.status(error.response.status).send(error.response.data);
    } else if (error.request) {
        res.status(503).send('Service Unavailable');
    } else {
        res.status(500).send('Internal Server Error');
    }

    next(error)
}

module.exports = {
    errorHandler
}