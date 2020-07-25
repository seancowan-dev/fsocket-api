// Streams Router contains functions and features which send video to the client
// But that do not firmly fit into any other route
const fs = require('fs');
const path = require('path'); // Required Boilerplate --start
const express = require('express');
const xss = require('xss');
const streamsRouter = express.Router();
const appDir = path.dirname(require.main.filename);
// const StreamsService = require('../services/tools.service');
const bodyParser = express.json(); // Required Boilerplate --end

streamsRouter.route('/getStream/:room_id/:watch_code')
           .get((req, res, next) => {
                let vidPath = path.join(appDir, "streams", req.params.room_id, 'youtube', req.params.watch_code);
                let data = fs.createReadStream(`${vidPath}.mp4`);
                data.pipe(res);
                res.status(200);
           })

module.exports = streamsRouter;