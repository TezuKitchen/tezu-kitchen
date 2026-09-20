ALTER TABLE users RENAME COLUMN push_token TO expo_push_token;
ALTER INDEX idx_users_push_token RENAME TO idx_users_expo_push_token;
