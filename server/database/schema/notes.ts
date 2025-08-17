import { pgTable, text, timestamp, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Example schema with Row Level Security (RLS) for user isolation
 * 
 * This demonstrates how to create a multi-tenant table where users
 * can only see and modify their own data.
 */
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // From OIDC auth (user.sub)
  title: text('title').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * RLS Policies (to be applied via migration)
 * 
 * These ensure complete user isolation:
 * 1. Users can only SELECT their own rows
 * 2. Users can only INSERT rows with their userId
 * 3. Users can only UPDATE their own rows
 * 4. Users can only DELETE their own rows
 * 
 * The policies use auth.user_id() which should be set
 * from the OIDC token in your auth middleware.
 */
export const notesRLSPolicies = sql`
  -- Enable RLS on the notes table
  ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
  
  -- Create function to get current user ID from session
  CREATE OR REPLACE FUNCTION auth.user_id() 
  RETURNS TEXT AS $$
    SELECT current_setting('app.user_id', true)::TEXT;
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
`