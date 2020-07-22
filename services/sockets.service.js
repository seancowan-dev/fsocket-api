// This service is for calling the SocketDBService, this is done in order to further separate concerns
// Code to actually manipulate the DB should be separate from code to prepare data between DB and client
const SocketDBService = require('../db_services/socket.database.service');
const YouTubeService = require('../services/youtube.service');
const { removeRoomMember } = require('../db_services/socket.database.service');

const SocketsService = {

    // Room Management

    // Read
    getAllRooms(io, database) { // Pass in the io and db objects
        SocketDBService.getAllRooms(database).then(result => { // Call the DB Service to get all the rooms
            io.sockets.emit('receiveAllRooms', result); // Emit the 'receiveAllRooms' event to the client, along with the list of rooms for it to receive
        });
    },

    // Create
    createRoom(io, database, serialized) { // Pass in the io, db and serialized room objects
        SocketDBService.addRoom(database, serialized).then(result => { // Call the DB service to insert the serialized room
            SocketDBService.getRoom(database, serialized.name).then(result => { // Call the DB service to emit the actual DB room
              io.sockets.emit('roomCreated', result); // Emit the DB room to confirm to the client that insertion was successful, and to trigger an update on the client side for room listings
            });
          }); 
    },
    
    // Delete
    deleteRoom(io, database, id) { // Pass in the io, and db objects and the room id to delete
        SocketDBService.deleteRoom(database, id).then(result => { // Call the DB service to delete the specified room
            io.sockets.emit('roomDeleted', id); // Emit the room ID to the client to confirm its removal
          });
    },
    // Update
        // Users
        
        // Add
        addUserToRoom(io, database, serialUser) { // Pass in the io, db and serialized user objects
            SocketDBService.addUserToRoom(database, serialUser).then(result => { // Call the DB service to add the user to the specified room
                io.sockets.emit('userAddedToRoom', serialUser); // Emit the serial user to the client to confirm that they have been added
            })
            .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                io.sockets.emit('userAddedToRoom', false);
            });
        },

        // Remove/Delete
        removeRoomMember(io, database, serialUser) { // Pass in the io, db and serialized user objects
            SocketDBService.removeRoomMember(database, serialUser.room_id, serialUser.user_id).then(result => { // Call the DB service to remove the user from the specified room
                io.sockets.emit('removedUserFromRoom', serialUser); // Emit the serial user to the client to confirm that they have been removed
            })
            .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                io.sockets.emit('removedUserFromRoom', false);
            });
        },
        
        // Messages

        // Add/Send
        sendMessage(io, database, serialMessage) { // Pass in the io, db and serialized message objects
            SocketDBService.sendMessage(database, serialMessage).then(result => { // Call the DB service to send a message to the server
                io.sockets.emit('messageSent', result); // Emit the message to the client for use in the specific room
              })
              .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                io.sockets.emit('messageSent', false);
              });
        },

        // Read/Get Messages [by room]
        getRoomMessages(io, database, room_id) { // Pass in the io and db objects and the room id
            SocketDBService.getRoomMessages(database, room_id).then(result => { // Call the DB service to retrieve messages from the database
                io.sockets.emit('receiveMessages', result); // Emit the found messages to the client for use in the specific room
              })
              .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                io.sockets.emit('receiveMessages', false);
              });
        },
    
    // Room Content Management (video)

        // Playlists
            // Create
            addToPlaylist(io, database, serialPlaylistEntry) { // Pass in the io, db and serialized playlist objects
                let addToDB = YouTubeService.saveVideoStreamYT(serialPlaylistEntry.room_id, serialPlaylistEntry.video_url, serialPlaylistEntry); // Call the YouTube service to save the video to the server's filesystem

                SocketDBService.addPlaylistEntry(database, addToDB).then(result => { // Call the DB service to add the path to the video to the playlist for the specific room
                  io.sockets.emit('playlistEntryAdded', result); // Emit the playlist entry to the client to confirm its success
                })
                .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                  io.sockets.emit('playistEntryAdded', false);
                });
            },

            // Read [by room]
            getPlaylist(io, database, room_id) {  // Pass in the io and db objects and the room id
                SocketDBService.getPlaylistEntries(database, room_id).then(result => {  // Call the DB service to retrieve the playlists entries for the specific room from the database
                    io.sockets.emit('retrievedPlaylist', result);  // Emit the playlist entries to the client so that they can listed in the host's playlist
                })
                .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                      io.sockets.emit('retrievedPlaylist', false);
                });
            }
};

module.exports = SocketsService;