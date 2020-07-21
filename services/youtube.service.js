// This service provides the functionality for fetching the user's youtube videos and storing them in the filesystem
// Once in the file system they can be added to the user's playlist queue

const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const appDir = path.dirname(require.main.filename);

const YouTubeService = {
    checkDirectory(dir) { // Each room has a streams directory stored under its UUID, this checks to see if it exists or not
        let jsonPath = path.join(appDir, "streams", dir); // Create absolute path
        if (!fs.existsSync(jsonPath)) { // Check to see if the dir exists
            fs.mkdirSync(jsonPath, { // It doesn't, so create it, recursive flagged true to avoid async issues
                recursive: true
            });
        }
    },
    saveVideoStreamYT(room_id, url, serialPlaylistEntry) {
        let dir = `./${room_id}/youtube`; // Set the dir for this room's youtube vids
        this.checkDirectory(dir); // Check if it exists and if not create it

        let urlParts = url.toString().split("/"); // Split the URL from client
        let yt = urlParts[0].substring(0, urlParts[0].length - 4); // We only want the name 'youtube' as the folder path
        let watch = urlParts[1].substring(8, urlParts[1].length); // Only get the watch code for the FLV

        let vidPath = path.join(appDir, "streams", room_id, yt, watch); // Complete new absolute path to store the vid

        ytdl(`https://${url}`).pipe(fs.createWriteStream(`${vidPath}.flv`)); // Grab the vid and store it to the local filesystem

        serialPlaylistEntry.video_path = `${vidPath}.flv`; // Set the video_path parameter in the serialPlaylistEntry

        let { db_room_id, video_path } = serialPlaylistEntry; // Destructure these parameters
    
        let addToDB = { // Compose the new serialPlayListEntry to add to the database
          room_id: db_room_id,
          video_path: video_path
        }

        return addToDB; // Return this object so that it can be inserted into the database
    }
}

module.exports = YouTubeService;