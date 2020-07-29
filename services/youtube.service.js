// This service provides the functionality for fetching the user's youtube videos and storing them in the filesystem
// Once in the file system they can be added to the user's playlist queue

const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);

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
    getYoutubeCode(url, serialPlaylistEntry) {

        let urlParts = url.toString().split("/"); // Split the URL from client
        let watch = urlParts[1].substring(8, urlParts[1].length); // Only get the watch code for the MP4

        serialPlaylistEntry.video_path = `${watch}`; // Set the video_path parameter in the serialPlaylistEntry

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