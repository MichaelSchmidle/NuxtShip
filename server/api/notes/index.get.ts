/**
 * Example API route using RLS-protected table
 * 
 * This route will automatically only return notes
 * belonging to the authenticated user thanks to RLS policies
 */
import { db } from '../../utils/db'
import { getAuthSession } from '../../utils/auth'
import { notes } from '../../database/schema/notes'

export default defineEventHandler(async (event) => {
  // Check if user is authenticated
  const session = await getAuthSession(event)
  if (!session?.userInfo) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  try {
    // Simple query - RLS automatically filters to user's notes only
    const userNotes = await db.select().from(notes)
    
    return {
      notes: userNotes,
      count: userNotes.length
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notes'
    })
  }
})