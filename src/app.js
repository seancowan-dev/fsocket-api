require('dotenv').config();  // Required Boilerplate --start
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const serializers = require('../serializers/serializers');
const { NODE_ENV, SERVER_URL, ORIGIN_URL, PORT } = require('./config');
const SocketDBService = require('../db_services/socket.database.service');
const app = express();  // Required Boilerplate --end
const toolsRouter = require('../routing/tools.routes'); // Routing Import --start
const { serialRoomOut } = require('../serializers/serializers');


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

server.listen(PORT, () => {
    console.log(`Server listening at ${SERVER_URL}`)
});

app.use('/site/tools', toolsRouter);

io.on('connection', (socket) => {
  let database = app.get('db')
  socket.emit('connected', { message: 'Socket Connected' });
  socket.on('createRoom', (serialized) => {
    SocketDBService.addRoom(database, serialized).then(result => {
        io.emit('roomCreated', result);
    }); 
  });
  socket.on('getAllRooms', () => {
    SocketDBService.getAllRooms(database).then(result => {
      io.emit('receiveAllRooms', result);
    });
  });
  socket.on('addUserToRoom', (serialUser) => {
    console.log(serialUser);
    SocketDBService.addUserToRoom(database, serialUser).then(result => {
      io.emit('userAddedToRoom', serialUser)
    })
  })
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