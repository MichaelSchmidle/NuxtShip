/**
 * Authentication utilities for server-side code
 * 
 * Provides helper functions to get user session data from nuxt-oidc-auth
 */
import type { H3Event } from 'h3'
// @ts-expect-error - Module types not available
import { getUserSession as getOidcUserSession } from 'nuxt-oidc-auth/runtime/server/utils/session.mjs'

/**
 * Get user session from the event context
 * Wrapper around nuxt-oidc-auth's getUserSession
 */
export async function getUserSession(event: H3Event) {
  try {
    const session = await getOidcUserSession(event)
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