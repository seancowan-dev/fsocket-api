// This service provides functions and helpers for the socket connections
const SocketDBService = {
    // Rooms
    addRoom(knex, serial) {
        return knex
        .insert(serial)
        .into('user_rooms')
        .returning('*')
        .then(rows => {
            return rows[0]
        });
    },
    getRoom(knex, name) {
        return knex.raw(`SELECT r.id, r.name, r.owner, r.description, r.password, r.created_at, m.id as member_id, m.user_id, m.room_id, m.name as member_name
        FROM user_rooms r
        FULL JOIN room_members m
        ON r.id = m.room_id
        WHERE r.name = '${name}'
        ORDER BY r.id`);
    },
    getAllRooms(knex) { // This function performs of a full join of all entries user_rooms and room_members, this data is later parsed by the client
        return knex.raw(`SELECT r.id, r.name, r.owner, r.description, r.password, r.created_at, m.id as member_id, m.user_id, m.room_id, m.name as member_name
        FROM user_rooms r
        FULL JOIN room_members m
        ON r.id = m.room_id
        ORDER BY r.id`);
    },
    updateRoom(knex, id, serial) {
        return knex.from('user_rooms')
        .where({ id })
        .update({ owner: serial.owner});
    },
    deleteRoom(knex, id) {
        return knex('user_rooms').where({ id }).delete();
    },
    // Room membership (join room)
    addUserToRoom(knex, serial) {
        return knex
        .insert(serial)
        .into('room_members')
        .returning('*')
        .then(rows => {
            return knex
            .from('room_members')
            .select('*')
            .where('room_id', serial.room_id);
        });
    },
    getRoomMembers(knex, room_id) {
        return knex
        .from('room_members')
        .select('*')
        .where('room_id', room_id);
    },
    removeRoomMember(knex, room_id, user_id) {
        return knex.from('room_members')
        .where({ user_id })
        .andWhere({ room_id })
        .delete();
    },
    sendMessage(knex, serial)  {
        return knex
        .insert(serial)
        .into('user_messages')
        .returning('*')
        .then(rows => {
            return rows[0]
        });
    },
    getRoomMessages(knex, room_id) {
        return knex
        .from('user_messages')
        .select('*')
        .where({ room_id });
    },
    addPlaylistEntry(knex, serial) {
        return knex
        .insert(serial)
        .into('room_playlist')
        .returning('*')
        .then(rows => {
            return rows[0];
        });
    },
    getSinglePlaylistEntry(knex, serial) {
        return knex
        .from('room_playlist')
        .where('room_id', serial.room_id)
        .andWhere('video_path', serial.video_path);
    },
    getPlaylistEntries(knex, room_id) {
        return knex
        .from('room_playlist')
        .where({ room_id });
    }
}

module.exports = SocketDBService;