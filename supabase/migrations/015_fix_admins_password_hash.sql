-- Migration 015: Make password_hash nullable on admins table
-- The password_hash column was added manually but is redundant since
-- Supabase Auth handles authentication via the user_id foreign key.
-- Making it nullable allows the team management API to create admins
-- without providing a password hash.
ALTER TABLE admins ALTER COLUMN password_hash DROP NOT NULL;
