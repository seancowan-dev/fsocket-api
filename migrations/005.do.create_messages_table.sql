CREATE TABLE IF NOT EXISTS
    user_messages(
        id uuid DEFAULT uuid_generate_v4 (),
        user_name VARCHAR(128) UNIQUE NOT NULL,
        date_added TIMESTAMPTZ NOT NULL,
        message VARCHAR(128),
        room_id uuid REFERENCES user_rooms(id) ON DELETE CASCADE,
        PRIMARY KEY(id)
    )