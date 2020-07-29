// This service is for calling the SocketDBService, this is done in order to further separate concerns
// Code to actually manipulate the DB should be separate from code to prepare data between DB and client
const SocketDBService = require('../db_services/socket.database.service');
const YouTubeService = require('../services/youtube.service');
const fetch = require('node-fetch');
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
    createRoom(io, database, serialized, socket) { // Pass in the io, db and serialized room objects
        SocketDBService.addRoom(database, serialized).then(result => { // Call the DB service to insert the serialized room
            SocketDBService.getRoom(database, serialized.name).then(result => { // Call the DB service to emit the actual DB room
                io.sockets.emit('roomCreated', result); // Emit the DB room to confirm to the client that insertion was successful, and to trigger an update on the client side for room listings
            });
          }); 
    },

    // Update [room owner]
    updateRoomOwner(io, database, serialRoom) { // Pass in the io, db and serialized room objects
        SocketDBService.updateRoom(database, serialRoom.id, serialRoom).then(res => { // Call the DB service to update serialized room
            SocketDBService.getRoom(database, serialRoom.name).then(result => { // Call the DB service to emit the actual [updated] room entry in the DB
                io.sockets.emit('roomOwnerUpdated', result.rows[0].owner); // Emit the updated room from the DB to the client
            })
        })
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
                io.sockets.emit('userAddedToRoom', result); // Emit the serial user to the client to confirm that they have been added
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
                let addToDB = YouTubeService.getYoutubeCode(serialPlaylistEntry.video_url, serialPlaylistEntry); // Call the YouTube service to save the video to the server's filesystem
                console.log('adding to playlist stage 2: checking if exists');
                SocketDBService.getSinglePlaylistEntry(database, addToDB).then(result => {
                    let exists = result.length > 0 ? true : false;

                    if(exists === false) { // If we found no existing entry, then its safe to add the entry
                        console.log('entry does not exist');
                        SocketDBService.addPlaylistEntry(database, addToDB).then(addResult => { // Call the DB service to add the path to the video to the playlist for the specific room
                            console.log('addedto playlist emit');
                            console.log(addResult);
                            // Get all the entries for this room to send back to the client
                            this.getPlaylist(io, database, addToDB.room_id);
                        })
                        .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                          io.sockets.emit('playistEntryAdded', false);
                        });
                    }
                    else { // Otherwise emit false so the client knows the entry already exist
                        console.log('entry already exists');
                        io.sockets.emit('playistEntryAdded', false);
                    }
                })

            },

            // Read [by room]
            getPlaylist(io, database, room_id, getListOnly = false) {  // Pass in the io and db objects and the room id
                console.log('getting the playlist entries');
                SocketDBService.getPlaylistEntries(database, room_id).then(playlistEntries => {  // Call the DB service to retrieve the playlists entries for the specific room from the database
                    console.log('got the playlist entries');

                    // If the query submits with no 4th property, then that means the client only wants the list of YT watch codes, not the full list of YT data objects
                    if (getListOnly === false) { // False only send watch codes
                        io.sockets.emit('playlistEntryAdded', playlistEntries); // Emit the playlist entries to the client so that they can listed in the host's playlist
                    } 
                    if (getListOnly === true) { // True so send completed YT data objects using the YT API
                        let listItems = playlistEntries.map(item => { // Map the video_path/watch code
                            return item.video_path;
                        });                        
                        this.getYouTubeVideoInfo(listItems, 'snippet, contentDetails').then(ytObj => { // Send all the items to youtube API and return the response
                            ytObj.fromRoom = room_id;
                            io.sockets.emit('retrievedPlaylistEntries', ytObj);
                        })
                        console.log('emitting all entries');
                    }
                    
                })
                .catch(err => { // Since its possible for a room to be open on a user's client whilst the room has actually been closed, return false if the operation fails
                    io.sockets.emit('playistEntryAdded', false); // Otherwise emit false so the client knows the entry already exist
                });
            },

            // Read (play video) - // This function indicates to the client a video is ready to play
            loadYTVid(io, serialPlaylistEntry) { // Pass in the io and db object, the room id, and the YouTube watch code
                let vid_path = serialPlaylistEntry.video_path // Get the video path
                
                if (vid_path !== false) { // If there is actually a video path to use, send the path to the client
                    io.sockets.emit('videoLoaded', serialPlaylistEntry);
                }
                else {  // Otherwise send an error message
                    io.sockets.emit('videoLoaded', "Could not find that video, perhaps the host closed the room while you were away?");
                }
            },
            async getYouTubeVideoInfo(videoIDs, findPart) { // Gets info for the specified videos
                const baseURL = "https://www.googleapis.com/youtube/v3/videos?";
                let queryString = this._encodeQueryParams(this._buildYouTubeVideoQueryParams(videoIDs, findPart));
                let requestURL = baseURL + queryString;
            
                let requestData = await fetch(requestURL) // Fetch data
                    .then(response => this._handleErrors(response)) // Check data
                    .then(responseJSON => {
                        return responseJSON;
                    })
                    .catch(e => alert(e));
            
                return requestData;
            },
            _buildYouTubeVideoQueryParams(videoIDs, findPart) { // Prepare the query information for finding YouTube videos
        
                // findPart must be one of the following valid YouTube parts: contentDetails, fileDetails, id, liveStreamingDetails, localizations
                // player, processingDetails, recordingDetails, snippet, statistic, status, suggestions, or topicDetails
            
                let params = {
                    key: "AIzaSyDDvSrO4-9C87TaVW3jodmB3UhiXhA66W0",
                    part: findPart,
                    id: videoIDs,
                    maxResults: 10,
                }
            
                return params;
            },
            _encodeQueryParams(params) { // Formats a given params object in the 'key=value&key=value' format
            const queryItems = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            return queryItems.join('&');
            },
            _handleErrors(response) { // prepares error message for HTTP request errors
                if (response.ok === true) {
                    return response.json();
                } else {
                    throw new Error("Code " + response.status + " Message: " + response.statusText)
                }
            }
};

module.exports = SocketsService;