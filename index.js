'use strict';

let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);

const PORT = 8080;

server.listen(PORT, () => {
    console.log('[INFO] Server up and runnig at PORT', PORT);
});

app.use(express.static(`${__dirname}/public`));
