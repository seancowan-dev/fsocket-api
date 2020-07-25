CREATE TABLE IF NOT EXISTS
      user_rooms(
        id uuid DEFAULT uuid_generate_v4 (),
        name VARCHAR(128) UNIQUE NOT NULL,
        owner VARCHAR(128) NOT NULL,
        description VARCHAR(128) NOT NULL,
        password VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY(id)
      )