require('dotenv').config();  // Required Boilerplate --start
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const serializers = require('../serializers/serializers');
const { NODE_ENV, SERVER_URL, ORIGIN_URL, PORT } = require('./config');
const SocketDBService = require('../db_services/socket.database.service');
const YouTubeService = require('../services/youtube.service');
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

io.sockets.on('connection', (socket) => {
  let database = app.get('db')
  socket.emit('connected', { message: 'Socket Connected' });
  socket.on('createRoom', (serialized) => {
    SocketDBService.addRoom(database, serialized).then(result => {
      SocketDBService.getRoom(database, serialized.name).then(result => {
        io.sockets.emit('roomCreated', result);
      });
    }); 
  });
  socket.on('deleteRoom', (id) => {
    SocketDBService.deleteRoom(database, id).then(result => {
      io.sockets.emit('roomDeleted', id);
    });
  });
  socket.on('getAllRooms', () => {
    SocketDBService.getAllRooms(database).then(result => {
      io.sockets.emit('receiveAllRooms', result);
    });
  });
  socket.on('addUserToRoom', (serialUser) => {
    SocketDBService.addUserToRoom(database, serialUser).then(result => {
      io.sockets.emit('userAddedToRoom', serialUser);
    })
    .catch(err => {
      io.sockets.emit('userAddedToRoom', false);
    });
  });
  socket.on('removeUserFromRoom', (serialUser) => {
    SocketDBService.removeRoomMember(database, serialUser.room_id, serialUser.user_id).then(result => {
      io.sockets.emit('removedUserFromRoom', serialUser);
    })
    .catch(err => {
      io.sockets.emit('removedUserFromRoom', false);
    });
  });
  socket.on('getRoomMessages', (room_id) => {
    SocketDBService.getRoomMessages(database, room_id).then(result => {
      io.sockets.emit('receiveMessages', result);
    })
    .catch(err => {
      io.sockets.emit('receiveMessages', false);
    });
  });
  socket.on('sendMessage', (serialMessage) => {
    SocketDBService.sendMessage(database, serialMessage).then(result => {
      io.sockets.emit('messageSent', result);
    })
    .catch(err => {
      io.sockets.emit('messageSent', false);
    });
  });
  socket.on('addToPlaylist', (serialPlaylistEntry) => {
    let vidPath = YouTubeService.saveVideoStreamYT(serialPlaylistEntry.room_id, serialPlaylistEntry.video_url);
    serialPlaylistEntry.video_path = vidPath;
    
    let { room_id, video_path } = serialPlaylistEntry;

    let addToDB = {
      room_id: room_id,
      video_path: video_path
    }

    SocketDBService.addPlaylistEntry(database, addToDB).then(result => {
      io.sockets.emit('playlistEntryAdded', result);
    })
    .catch(err => {
      io.sockets.emit('playistEntryAdded', false);
    });
  });
  socket.on('getPlaylist', (room_id) => {
    SocketDBService.getPlaylistEntries(database, room_id).then(result => {
      io.sockets.emit('retrievedPlaylist', result);
      })
      .catch(err => {
        io.sockets.emit('retrievedPlaylist', false);
    });
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