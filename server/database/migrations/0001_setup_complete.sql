-- Create auth schema for RLS functions
CREATE SCHEMA IF NOT EXISTS auth;

-- Create notes table
CREATE TABLE IF NOT EXISTS "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Enable RLS on the notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create function to get current user ID from session
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS TEXT AS $$
  SELECT current_setting('auth.user_id', true)::TEXT;
$$ LANGUAGE SQL STABLE;

-- Policy: Users can only see their own notes
CREATE POLICY notes_select_policy ON notes
  FOR SELECT
  USING (user_id = auth.user_id());

-- Policy: Users can only insert notes for themselves  
CREATE POLICY notes_insert_policy ON notes
  FOR INSERT
  WITH CHECK (user_id = auth.user_id());

-- Policy: Users can only update their own notes
CREATE POLICY notes_update_policy ON notes
  FOR UPDATE
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

-- Policy: Users can only delete their own notes
CREATE POLICY notes_delete_policy ON notes
  FOR DELETE
  USING (user_id = auth.user_id());