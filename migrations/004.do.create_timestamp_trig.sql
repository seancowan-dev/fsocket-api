CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_rooms
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();