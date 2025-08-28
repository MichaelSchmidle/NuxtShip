/**
 * Authentication utilities for server-side code
 * 
 * Provides helper functions to work with Logto authentication
 */
import type { H3Event } from 'h3'

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