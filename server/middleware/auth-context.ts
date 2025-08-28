/**
 * Middleware to set user context for Row Level Security
 * 
 * This middleware extracts the user ID from the Logto session
 * and sets it as a PostgreSQL session variable that RLS policies
 * can access via auth.user_id()
 */
import { sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { logtoEventHandler } from '#logto'

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  try {
    // Initialize Logto event handler
    const config = useRuntimeConfig(event)
    await logtoEventHandler(event, config)
    
    // Get user from Logto session
    const user = await event.context.logtoClient?.getIdTokenClaims()
    const userId = user?.sub

    if (userId) {
      // Set the user ID in PostgreSQL session for RLS
      // Use SET SESSION instead of SET LOCAL (doesn't require transaction)
      // Use sql.raw because SET doesn't support parameterized queries
      await db.execute(sql.raw(`SET SESSION auth.user_id = '${userId.replace(/'/g, "''")}'`))
      
      // Store in event context for use in API routes
      event.context.userId = userId
      event.context.user = user
    }
  } catch (error) {
    // Log but don't fail - some routes might be public
    // This is expected when user is not authenticated
    if (error.message !== 'Not authenticated.') {
      console.error('Failed to set auth context:', error)
    }
  }
})