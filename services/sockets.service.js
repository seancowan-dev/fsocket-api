// This service is for calling the SocketDBService, this is done in order to further separate concerns
// Code to actually manipulate the DB should be separate from code to prepare data between DB and client
const SocketDBService = require('../db_services/socket.database.service');
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
        
        //Add
        addUserToRoom(io, database, serialUser) {
            SocketDBService.addUserToRoom(database, serialUser).then(result => {
                io.sockets.emit('userAddedToRoom', serialUser);
            })
            .catch(err => {
                io.sockets.emit('userAddedToRoom', false);
            });
        },

        //Remove/Delete
        removeRoomMember(io, database, serialUser) {
            SocketDBService.removeRoomMember(database, serialUser.room_id, serialUser.user_id).then(result => {
                io.sockets.emit('removedUserFromRoom', serialUser);
            })
            .catch(err => {
                io.sockets.emit('removedUserFromRoom', false);
            });
        },
        
};

module.exports = SocketsService;