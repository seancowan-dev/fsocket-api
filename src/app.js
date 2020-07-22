require('dotenv').config();  // Required Boilerplate --start
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const serializers = require('../serializers/serializers');
const { NODE_ENV, SERVER_URL, ORIGIN_URL, PORT } = require('./config');
const SocketDBService = require('../db_services/socket.database.service');
const SocketsService = require('../services/sockets.service');
const YouTubeService = require('../services/youtube.service');
const app = express();  // Required Boilerplate --end
const toolsRouter = require('../routing/tools.routes'); // Routing Import --start
const { serialRoomOut } = require('../serializers/serializers');
const { Socket } = require('dgram');

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

// HTTP routes
app.use('/site/tools', toolsRouter);


// [start of] WebSocket 'routes' //
// Note: WebSockets don't use routes, they have to live in the app root

// Connect a socket when a user requests a socket
io.sockets.on('connection', (socket) => { // Establish base WebSocket connection
  let database = app.get('db') // Get the DB info

  socket.emit('connected', { message: 'Socket Connected' }); // Emit a confirmation event to the client

  // Begin Routes //

  // WebSockets for room management
  // Read
  socket.on('getAllRooms', () => { // When the event 'getAllRooms' is received from the client
    SocketsService.getAllRooms(io, database); // Get all the rooms
  });
  // Create
  socket.on('createRoom', (serialized) => { // Create a room
    SocketsService.createRoom(io, database, serialized);
  });
  // Delete
  socket.on('deleteRoom', (id) => { // Delete a room
    SocketsService.deleteRoom(io, database, id);
  });

  // Update
    // 'Updating' a chat room involves adding and deleting users or content from the chatroom
    // Those functions perform the update operations

    // Users
      // Add User
      socket.on('addUserToRoom', (serialUser) => {
        SocketsService.addUserToRoom(io, database, serialUser);
      });

      // Delete User
      socket.on('removeUserFromRoom', (serialUser) => {
        SocketsService.removeRoomMember(io, database, serialUser);
      });

    // Messages
      // Add (send) Message
      socket.on('sendMessage', (serialMessage) => {
        SocketsService.sendMessage(io, database, serialMessage);
      });

      // Read (get) Messages [by room]
      socket.on('getRoomMessages', (room_id) => {
        SocketsService.getRoomMessages(io, database, room_id);
      });

  ////// [end of] WebSockets for room management
  // WebSockets for room content management
    // Playlists
      // Create
      socket.on('addToPlaylist', (serialPlaylistEntry) => {
        SocketsService.addToPlaylist(io, database, serialPlaylistEntry);
      });

      // Read
      socket.on('getPlaylist', (room_id) => {
        SocketsService.getPlaylist(io, database, room_id);
      });
});

//////// [end of] WebSocket routes ////////

// Setup an error handler
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