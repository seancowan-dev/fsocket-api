CREATE TABLE IF NOT EXISTS 
    room_members(
        id uuid DEFAULT uuid_generate_v4 (),
        user_id uuid NOT NULL,
        room_id uuid NOT NULL REFERENCES user_rooms(id) ON DELETE CASCADE,
        name VARCHAR(256) NOT NULL,
        unique(user_id, room_id),
        PRIMARY KEY(id)
    )
