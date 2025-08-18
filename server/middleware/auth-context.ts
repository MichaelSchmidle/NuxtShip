/**
 * Middleware to set user context for Row Level Security
 * 
 * This middleware extracts the user ID from the OIDC session
 * and sets it as a PostgreSQL session variable that RLS policies
 * can access via auth.user_id()
 */
import { sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { getAuthSession } from '../utils/auth'

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  try {
    // Get user from OIDC session using nuxt-oidc-auth
    const session = await getAuthSession(event)
    const userId = session?.userInfo?.sub as string | undefined

    if (userId) {
      // Set the user ID in PostgreSQL session for RLS
      await db.execute(sql`SET LOCAL auth.user_id = ${userId}`)
      
      // Store in event context for use in API routes
      event.context.userId = userId
      event.context.user = session.userInfo
    }
  } catch (error) {
    // Log but don't fail - some routes might be public
    console.error('Failed to set auth context:', error)
  }
})