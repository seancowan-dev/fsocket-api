require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const fetch = require('node-fetch')
const { NODE_ENV, SERVER_URL, ORIGIN_URL, PORT } = require('./config');
const app = express();


const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors({
    origin: ORIGIN_URL,
    credentials: true
}));

const server = require('http').Server(app);
const io = require('socket.io')(server);

async function getUserIP() {
  let json = await fetch('http://ip-api.com/json');
  return json.json();
}

server.listen(PORT, () => {
    console.log(`Server listening at https://${SERVER_URL}:${PORT}`)
  });
// WARNING: app.listen(80) will NOT work here!

app.get('/', (req, res) => {
  res.send("got it"); 
});

app.get('/getIP', (req, res) => {
  getUserIP().then(response => {
    res.send(response);
  })
})

io.on('connection', (socket) => {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', (data) => {
    console.log(data);
  });
});


app.use(function errorHandler(error, req, res, next) {
    let response;
        if (NODE_ENV === 'production') {
            response = { error: { message: 'server error' } };
        } else {
            console.error(error);
            response = { message: error.message, error };
        }
        res.status(500).json(response);
});

module.exports = app