const server = require('../src/app');
const io = require('socket.io-client'); 
const config = require('../src/config');
const ENDPOINT = config.SERVER_URL;
const knex = require('knex');
const { expectCt } = require('helmet');
const uuid = require('uuid');

let ioOptions = { 
          transports: ['websocket']
        , forceNew: true
        , reconnection: false
      };
let client1, client2, db;

describe('Socket.io Test Object', () => {

    // Instantiate Knex Object //
      db = knex({
        client: 'pg',
        connection: config.DATABASE_URL,
      });
      
      server.set('db', db);

  // Disconnect and Clean //
  beforeEach('clean table', ()=> db.raw('TRUNCATE room_playlist RESTART IDENTITY CASCADE'));
  beforeEach('clean table', ()=> db.raw('TRUNCATE room_members RESTART IDENTITY CASCADE'));
  beforeEach('clean table', ()=> db.raw('TRUNCATE user_messages RESTART IDENTITY CASCADE'));
  beforeEach('clean table', ()=> db.raw('TRUNCATE user_rooms RESTART IDENTITY CASCADE'));
  
  // after('clean table after each test', ()=> db.raw('TRUNCATE room_playlist RESTART IDENTITY CASCADE'));
  // after('clean table after each test', ()=> db.raw('TRUNCATE room_members RESTART IDENTITY CASCADE'));
  // after('clean table after each test', ()=> db.raw('TRUNCATE user_messages RESTART IDENTITY CASCADE'));

  describe('User connected', () => {
    it(`Client Emits: 'connection', Sever Emits: 'connected' and sends a console message indicating success`, (done) => {
      client1 = io.connect(ENDPOINT, ioOptions);
      let expectedResponse = { message: 'Socket Connected' };
      client1.on('connected', (data) => {
        expect(data.message).to.equal(expectedResponse.message);
      });
      done();
    });
  });
  
  let serialRoom = {
    name: 'Large_Boistrous_Cuddlefish',
    owner: 'Large_Boistrous_Cuddlefish',
    description: 'this is a test room object',
    password: null
  }

  let deleteSerialRoom = {
    name: 'Round_Semantic_Badger',
    owner: 'Round_Semantic_Badger',
    description: 'this is a test room object',
    password: null
  }
    describe('Room Created', () => {
      it(`Client Emits: 'createRoom', Server Emits: 'roomCreated' and an updated serialized room object`, (done) => {
        client1 = io.connect(ENDPOINT, ioOptions);
  
        // First emit a test room to the server
        client1.emit('createRoom', serialRoom);
  
        // Now get the room data
        
        client1.on('roomCreated', (data) => {
          // If these properties could be fetched that means the server processed the data properly
          expect(data.rows[0]).to.have.property('id');
          expect(data.rows[0]).to.have.property('name');
          expect(data.rows[0]).to.have.property('owner');
          expect(data.rows[0]).to.have.property('description');   
        });
        done();
      });
    });
    describe('Room Owner Changed', () => {
      it(`Client Emits: 'updateRoomOwner', Sever Emits: 'roomOwnerUpdated' and returns an updated room object`, (done) => {
        client1 = io.connect(ENDPOINT, ioOptions);
        client2 = io.connect(ENDPOINT, ioOptions);
  
        // First emit a test room to the server
        client1.emit('createRoom', serialRoom);
  
        // Now get the room data
  
        client1.on('roomCreated', (data) => {
          let newOwner = 'Small_Timid_Octopus';

          data.rows[0].owner = newOwner;
          // Now send the request to change the room owner
          client1.emit('updateRoomOwner', data.rows[0]);
          
          // If the input id matches the output id then the entry was deleted correctly
          client1.on('roomOwnerUpdated', (newRoom) => {
            expect(newRoom.owner).to.equal(newOwner);
            let room_id = newRoom.id;

            let serialUsers = [
              {
                room_id: room_id,
                user_id: uuid.v4(),
                name: 'Large_Boistrous_Cuddlefish'
              },
              {
                room_id: room_id,
                user_id: uuid.v4(),
                name: 'Small_Timid_Octopus'
              }
            ];

            // User, Message and Playlist events depend on the room existing to be tested
            // When the owner changes the room ID updates, as such it is necessary to nest these test after the owner update test
            describe('Adding User To Room | User Should Be Added but not exist yet', () => {
              it(`Client Emits: 'addUserToRoom', Sever Emits: 'userAddedToRoom' and returns false on failure`, (done) => {

                client1.emit('addUserToRoom', (serialUsers[0]));
  
                client1.on('userAddedToRoom', (updatedUser) => {
                   // The server should fail on this test because the next test needs to start to see if the user existed
                   expect(updatedUser).to.eql(false);
                });
                done();
              });
            });

            // Try to send a message from client 1 and check to see if client 2 can see it
            describe('Sending and Receiving Messages', () => {
              it(`Client1 Emits: 'sendMessage', Server Emits: 'messageSent' | On this stage the message returned should be false`, (done) => {
                // Now connect another user to the same room and test the messaging and playlist functionality
                client2.emit('addUserToRoom', (serialUsers[1]));

                let serialMessage = {
                  user_name: serialUsers[0].name,
                  message: 'The spider crawled up the water spout',
                  room_id: serialUsers[0].room_id
                };

                client1.emit('sendMessage', serialMessage);

                client1.on('messageSent', (message) => {
                  expect(message).to.eql(false);
                });
                done();
              });
              let clientMsgs = [];
              it(`Client1 Emits: 'getRoomMessages', Server Emits: 'receiveMessages' | On this stage we should have data`, (done) => {
                client1.emit('getRoomMessages', serialUsers[0].room_id);
                client1.on('receiveMessages', (msgs) => {
                  clientMsgs[0] = msgs;
                  expect(msgs).to.not.equal(null || undefined);
                });
                done();
              });
              it(`Client2 Emits: 'getRoomMessages', Server Emits: 'receiveMessages' | On this stage we should have data`, (done) => {
                client2.emit('getRoomMessages', serialUsers[0].room_id);
                client2.on('receiveMessages', (msgs) => {
                  clientMsgs[1] = msgs;
                  expect(msgs).to.not.equal(null || undefined);
                });
                done();
              });
              it(`Client1 and Client2 should have matching message values | If successful messages are sending and receiving properly`, (done) => {
                expect(clientMsgs[0]).to.eql(clientMsgs[1]);
                done();
              });
            });

            // Try to send a playlist entry
            describe('Sending and Receiving Playlists', () => {
              it(`Client Emits: 'addToPlaylist', Sever Emits: 'playlistEntryAdded' | On this stage the playlist returned should be false`, (done) => {

                // Build a playlist entry
                let playlistEntry = {
                  room_id: serialUsers[0].room_id,
                  video_url: "https://www.youtube.com/watch?v=QmP4DJO6IzE"
                }

                //Emit the entry
                client1.emit('addToPlaylist', playlistEntry);

                // The returned entry should be false because socket.io hasn't had time to update until the next test runs
                client1.on('playlistEntryAdded', (addedPlaylistEntry) => {
                   // The server should fail on this test because the next test needs to start to see if the user existed
                   expect(addedPlaylistEntry).to.eql(false);
                });
                done();
              });
              // Try to get and retrieve a playlist
              it(`Client Emits: 'getPlaylist', Sever Emits: 'retrievedPlaylistEntries' | On this stage the playlist entries should be returned to the client`, (done) => {
                // Build a playlist entry
                let playlistEntry = {
                  room_id: serialUsers[0].room_id,
                  video_url: "https://www.youtube.com/watch?v=QmP4DJO6IzE"
                }

                // Ask the server for the entry
                client1.emit('getPlaylist', playlistEntry.room_id);

                // Entry should now exist
                client1.on('retrievedPlaylistEntries', (retrievedPlaylistEntries) => {
                   // Server should return entries for the requested room
                   expect(retrievedPlaylistEntries.fromRoom).to.eql(playlistEntry.room_id);
                   expect(retrievedPlaylistEntries).to.have.property('items');
                });
                done();
              });
            });
            
            // To play a video simply requires broadcasting the action, check to see if this happens on both clients
            describe('Playing Video | Client2 should see response from Client1', () => {
              it(`Client Emits: 'addUserToRoom', Sever Emits: 'userAddedToRoom' and returns false on failure`, (done) => {

                // build the list entry object
                let listEntry = {
                  room_id: serialUsers[0].room_id,
                  video_path: 'QmP4DJO6IzE'
                };

                client1.emit('loadVideo', (listEntry));
                client2.on('videoLoaded', (vid_data) => {
                  expect(vid_data.video_path).to.eql(listEntry.video_path);
                });
                done();
              });
            });

            // When successful this test proves that the user was both added successfully and removed successfully
            describe('Remove User From Room | User Should Be Removable - Confirms both adding and removal are working', () => {
              it(`Client Emits: 'addUserToRoom', Sever Emits: 'userAddedToRoom' and returns a user id matching the input user confirming deletion`, () => {

                client1.emit('removeUserFromRoom', (serialUsers[0]));
  
                client1.on('removedUserFromRoom', (deleted) => {
                   // The server should return the ID of the deleted user
                  expect(deleted.user_id).to.eql(serialUsers[0].user_id);
                });
              });
            });
          });
        });
        done();
      });
    });

    describe('Room Deleted', () => {
      // Use a different room so as not to interfere with the above tests
      it(`Client Emits: 'deleteRoom', Sever Emits: 'roomDeleted' and its id to confirm`, (done) => {
        client1 = io.connect(ENDPOINT, ioOptions);
  
        // First emit a test room to the server
        client1.emit('createRoom', deleteSerialRoom);
  
        // Now get the room data
  
        client1.on('roomCreated', (data) => {
  
          // Now send the request to the server to delete the room
          client1.emit('deleteRoom', data.rows[0].id);
  
          // If the input id matches the output id then the entry was deleted correctly
          client1.on('roomDeleted', (deleted) => {
            expect(data.rows[0].id).to.equal(deleted);
            // Disconnect the clients since this is the last test
            client1.disconnect();
            client2.disconnect();
          });
        });
        done();
      });
    });
});
