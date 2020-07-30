# fSocket (Node) [API]
Access the site here: https://fsocket-client-git-project-complete.seancowan-dev.now.sh/

This is the API to see the source for the Client go here: https://github.com/seancowan-dev/fsocket-client

![Image of Client](https://i.imgur.com/FagKdqN.png)

This application allows users to host chat rooms and to share the URL of the room with their friends.  Once they are in the room they can paste Youtube URLs directly into the chat.  This will add the videos to a playlist which the room host can control.  When the room host plays a video, the video plays for all people in the room.  Its a quick and easy way to watch a video with a friend!

## Why This App Was Made

This app was made because due to the reduced amount of socialization we are all experiencing during the pandemic, I have found myself looking for ways to watch videos with my friends over the internet.  There are many offerings available on tap online, but this is my implementation.  I primarily watch Youtube with my friends and I found that many of the existing video-sharing applications were too verbose, there's too many features.  This application was developed so that anyone who is looking for a barebones, quick, and simple way to watch a Youtube video with a few friends can have that option available to them.

## API

https://damp-falls-21610.herokuapp.com/

This application uses a websocket based API implemented with [Socket.io](https://socket.io/) and as such as a non-traditional data flow.  There are no http endpoints in this application.  Socket.io operates on 'events' - named queries sent to the socket can respond with other named queries. This allows for highly specialized real-time content updates. This events operate using an 'emit' and 'on' syntax.  Events are emitted, and on reception of those events, other actions can be taken.

## Summary of Socket.io Endpoints

Socket.io endpoints must live in the application root in order to operate correctly.

The Client Callback Event is the event which is sent by the client (if any) when the server responds to the initial action.  If this column is shown as 'none' then there is no callback, and the client simply displays the received data.

| Client Emitted Event | Actions Taken | Server Response Event | Actions Taken | Client Callback Event |
| ----------- | ----------- | ----------- | ----------- | ----------- |
| connection | Client emits a request to the server to connect | connected | Sever emits a response to the client confirming connection | getAllRooms |
| getAllRooms | Client emits a request to the server to get all the currently open rooms | receiveAllRooms | Server emits an event telling the client to receive the rooms and the corresponding room data | none |
| createRoom | Client emits a request to the server to create a room with the given name and description | roomCreated | Server emits a response to the server containing the room that was just inserted into the database | none |
| deleteRoom | Client emits a request to the server with the UUID of the room that should be deleted | roomDeleted | Server emits a response and the UUID of the room, if the UUID matches input ID, deletion was successful | none |
| updateRoomOwner | Client emits a request to the server with the updated room object indicating the  new owner | roomOwnerUpdated | Server emits a response to the client to update the specific rooms and affected user(s) | none |
| addUserToRoom | Client emits a request to the server with the user object indicating the new user to add | userAddedToRoom | Server emits a response to the client with the completed user object from the database | none |
| removeUserFromRoom | Client emits a request to the server with the user object containing UUIDs for the user and room | removedUserFromRoom | Server emits a response to the client with either the UUID of the removed user to confirm deletion, or false if the user was already deleted | none |
| sendMessage | Client emits a request to the server with the message object indicating the room, user, and message sent | messageSent | Server emits a response to the client telling all members of the room that a new message was sent | getRoomMessages |
| getRoomMessages | Clients of all room members in the specified room in the original 'sendMessage' emit a request to the server to get the updated messages for the room | receiveMessages | Server emits a response indicating that messages have been found, and the corresponding room messages to all clients of the apprporiate room | none |
| addToPlaylist | Client emits a request to the server with the youtube URL that was entered into the chat window | playistEntryAdded | Server emits a response to all clients connected to the same room with the new playlist entry, or if that room was deleted while the request was running for some reason, it returns false | none |
| getPlaylist | Client emits a request to the server with the UUID of the room for which a playlist is desired | retrievedPlaylistEntries | Server emits all the playlist entries to all clients connected to the specified room | none |
| loadVideo | Client of the host emits a request to the server to play the specified Youtube video from the playlist for a particular room | videoLoaded | Server emits a response to all clients connected to that room instructing the Youtube player to play the video | none |

## Technology Used

The application is built on HTML, CSS, JavaScript, React + MobX, Socket.io and Node with Express and PGSQL
