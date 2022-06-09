// Dependencies
const express = require('express');
//const createHttpServer = require('http').createServer;
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('test.key'),
  cert: fs.readFileSync('test.crt')
};
const createIo = require('socket.io');
const createPeerServer = require('peer').ExpressPeerServer;

// Environment
const port = process.env.PORT || 59798;

// Routes
const app = express();
const httpServer = https.createServer(options,app);
const io = createIo(httpServer);
const peerServer = createPeerServer(httpServer);
app.use('/api', peerServer);
app.use(express.static(__dirname));

// Boot
httpServer.listen(port, () => {
    console.log(`Server Run`);
});

// Manage p2p keys
const keys = [];
peerServer.on('connection', (key) => {
    keys.push(key);
    //console.log('connected', keys);
});
peerServer.on('disconnect', (key) => {
    const index = keys.indexOf(key);
    if (index > -1) {
        keys.splice(index, 1);
    }
    //console.log('disconnect', keys);

    //io.emit('keys', keys);// 同上
});