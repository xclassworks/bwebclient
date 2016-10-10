'use strict';

let express = require('express');
let app = express();
let bUtils = require('butils');

let server = bUtils.getServer(app);
let io = require('socket.io')(server);

const PORT = bUtils.getWebAppPort();

server.listen(PORT, () => {
    console.log('[INFO] Server up and runnig at PORT', PORT);
});

app.use(express.static(`${__dirname}/public`));

app.get('/configs', (req, resp) => {
    resp.send(bUtils.getBmateConfigs());
});
