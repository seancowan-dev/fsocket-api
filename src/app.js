require('dotenv').config();  // Required Boilerplate --start
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const serveStatic = require('serve-static');
const serializers = require('../serializers/serializers');
const { NODE_ENV, SERVER_URL, ORIGIN_URL, PORT } = require('./config');
const SocketDBService = require('../db_services/socket.database.service');
const SocketsService = require('../services/sockets.service');
const YouTubeService = require('../services/youtube.service');
const app = express();  // Required Boilerplate --end
const toolsRouter = require('../routing/tools.routes'); // Routing Import --start
const streamsRouter = require('../routing/streams.routes');
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
const ss = require('socket.io-stream');

server.listen(PORT, () => {
    console.log(`Server listening at ${SERVER_URL}`)
});

// HTTP routes
app.use('/site/tools', toolsRouter);
app.use('/site/streams/', streamsRouter);


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
    //This is the only function for updating a room directly in the typical definition of update for CRUD operations
    //The only time the app should need to update the room itself is if the ownership (control of the video player) of the room has been handed off to someone else
      socket.on('updateRoomOwner', (serialRoom) => {
        SocketsService.updateRoomOwner(io, database, serialRoom);
      })

    // 'Updating' a chat room also involves adding and deleting users or content from the chatroom
    // These functions perform the update operations

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
        console.log('adding to playlist');
        SocketsService.addToPlaylist(io, database, serialPlaylistEntry);
      });

      // Read [playlist by room]
      socket.on('getPlaylist', (room_id) => {
        SocketsService.getPlaylist(io, database, room_id);
      });

      // Read [playlist entries]
      ss(socket).on('stream', (serialPlaylistEntry) => {
        console.log('stream request seen');
        console.log('with room id: ' + serialPlaylistEntry.room_id);
        console.log('and with object: ' + serialPlaylistEntry);
        SocketsService.playYTVideo(io, ss, serialPlaylistEntry.room_id, serialPlaylistEntry);
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