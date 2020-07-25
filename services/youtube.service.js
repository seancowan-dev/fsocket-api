// This service provides the functionality for fetching the user's youtube videos and storing them in the filesystem
// Once in the file system they can be added to the user's playlist queue

const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const appDir = path.dirname(require.main.filename);
const config = require('../src/config');

const YouTubeService = {
    checkDirectoryCreate(dir) { // Each room has a streams directory stored under its UUID, this checks to see if it exists and creates if it does
        let jsonPath = path.join(appDir, "streams", dir); // Create absolute path
        if (!fs.existsSync(jsonPath)) { // Check to see if the dir exists
            fs.mkdirSync(jsonPath, { // It doesn't, so create it, recursive flagged true to avoid async issues
                recursive: true
            });
        }
    },
    checkDirectory(dir) { // Each room has a streams directory stored under its UUID, this checks to see if it exists and return true or false
        let jsonPath = path.join(appDir, "streams", dir); // Create absolute path
        if (!fs.existsSync(jsonPath)) { // Check to see if the dir exists
            return false;
        } else {
            return true;
        }
    },
    saveVideoStreamYT(in_room_id, url, serialPlaylistEntry) {
        let dir = `./${in_room_id}/youtube`; // Set the dir for this room's youtube vids
        this.checkDirectoryCreate(dir); // Check if it exists and if not create it

        let urlParts = url.toString().split("/"); // Split the URL from client
        let yt = urlParts[0].substring(0, urlParts[0].length - 4); // We only want the name 'youtube' as the folder path
        let watch = urlParts[1].substring(8, urlParts[1].length); // Only get the watch code for the MP4

        let vidPath = path.join(appDir, "streams", in_room_id, yt, watch); // Complete new absolute path to store the vid

        ytdl(`https://${url}`).pipe(fs.createWriteStream(`${vidPath}.mp4`)); // Grab the vid and store it to the local filesystem

        serialPlaylistEntry.video_path = `${vidPath}.mp4`; // Set the video_path parameter in the serialPlaylistEntry

        let { room_id, video_path } = serialPlaylistEntry; // Destructure these parameters
    
        let addToDB = { // Compose the new serialPlayListEntry to add to the database
          room_id: room_id,
          video_path: video_path
        }

        return addToDB; // Return this object so that it can be inserted into the database
    },
    getYouTubePath(room_id, serialPlaylistEntry) { // This function checks to see if the room has a video directory, if so it sends the path back to the client
        console.log('started to find stream with entry: ' + serialPlaylistEntry);
        let dir = `./${room_id}/youtube`; // Set the dir for this room's youtube vids
        let dirExists = this.checkDirectory(dir); // Check if it exists or not

        if (dirExists === true) { // Only try to play the video if the directory for this room exists
            let streamPath = serialPlaylistEntry.video_path; // Get the path from the playlist entry
            console.log('got the stream path: ' + streamPath); 
            if (streamPath) { // If successful return the stream path
                return streamPath;
            }
            else {
                return false; // Return false so we know something went wrong
            }
        }
        if (dirExists === false) {
            // For now just log something, but eventually return some error messaging that can be displayed to the user in a clean way
            console.log("Could not find that video, the room was probably closed and the temporary file was deleted");
        }
    }
}

module.exports = YouTubeService;