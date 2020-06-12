// This service provides functions and helpers for the tools router

const fetch = require('node-fetch'); // Required Boilerplate --start

const ToolsService = {
    async getUserIP(ip) { // Retrieve the user's IP information
        let json = await fetch(`http://ip-api.com/json/${ip}`);
        return json.json();
      }
}

module.exports = ToolsService;