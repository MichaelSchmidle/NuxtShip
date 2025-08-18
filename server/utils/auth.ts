/**
 * Authentication utilities for server-side code
 * 
 * Provides helper functions to get user session data from nuxt-oidc-auth
 */
import type { H3Event } from 'h3'

/**
 * Get user session from the event context
 * Note: This function dynamically imports getUserSession to avoid build-time issues
 */
export async function getAuthSession(event: H3Event) {
  try {
    // Dynamic import using the correct export path
    const sessionModule = await import('nuxt-oidc-auth/runtime/server/utils/session.js')
    const session = await sessionModule.getUserSession(event)
    return session
  } catch {
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function requireAuth(event: H3Event) {
  const userId = event.context.userId
  
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }
  
  return userId
}

/**
 * Get the current user from context
 */
export function getUser(event: H3Event) {
  return event.context.user || null
}