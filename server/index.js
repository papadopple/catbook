const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '../client/build')));

// start the server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Hello world! Listening on port ${port}`));