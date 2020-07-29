CREATE TABLE IF NOT EXISTS 
    room_playlist(
        id uuid DEFAULT uuid_generate_v4 (),
        room_id uuid NOT NULL REFERENCES user_rooms(id) ON DELETE CASCADE,
        video_path VARCHAR(2083) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(id)
    )