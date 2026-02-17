const express = require('express');
const dataCollectionController = require('./modules/data-collection/data-collection.controller');

const app = express();

app.use(express.json());

app.use('/data-collection', dataCollectionController);

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'TJ Scrap Analysis API' });
});

module.exports = app;
