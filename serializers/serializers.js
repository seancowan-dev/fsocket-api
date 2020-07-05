const xss = require('xss');

const serialRoomOut = room => ({
    id: xss(room.id),
    name: xss(room.name),
    owner: xss(room.owner),
    description: xss(room.description),
    password: xss(room.password),
    created_at: xss(room.created_at)
})

module.exports = {
    serialRoomOut
}