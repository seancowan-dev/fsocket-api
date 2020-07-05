// Tools Router contains functions and features which must operate on the server
// But that do not firmly fit into any other route

const path = require('path'); // Required Boilerplate --start
const express = require('express');
const xss = require('xss');
const toolsRouter = express.Router();
const ToolsService = require('../services/tools.service');
const bodyParser = express.json(); // Required Boilerplate --end

toolsRouter.route('/getIP')
           .get((req, res, next) => {
               // req.headers['x-forwarded-for'] for live
                ToolsService.getUserIP('173.32.221.220').then(toolRes => {
                    res.status(200).send(toolRes);
                }).catch(next);
           })

module.exports = toolsRouter;