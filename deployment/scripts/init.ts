#!/usr/bin/env bun

import { execSync } from 'child_process'

/**
 * Single-Step NuxtShip Setup
 * 
 * This script provides a complete, seamless setup experience:
 * 1. Environment configuration
 * 2. Infrastructure setup (certificates, containers, database)
 * 3. Interactive Logto configuration
 * 
 * Everything happens in one flow without artificial breaks.
 */

interface LogtoApplication {
  id: string
  secret: string
  name: string
}

async function main() {
  console.log('🚀 NuxtShip Setup')
  console.log('=================')
  console.log()

  try {
    // Step 1: Environment setup
    console.log('1️⃣ Setting up environment...')
    execSync('bun run setup:env', { stdio: 'inherit' })
    console.log('✅ Environment configured')
    
    // Step 2: Infrastructure setup
    console.log('\n2️⃣ Setting up infrastructure...')
    execSync('bun run setup:full', { stdio: 'inherit' })
    console.log('✅ Infrastructure ready')
    
    // Step 3: Wait for Logto to be ready
    console.log('\n3️⃣ Waiting for Logto to be ready...')
    await waitForLogto()
    console.log('✅ Logto is ready!')
    
    // Step 4: Interactive Logto setup
    console.log('\n4️⃣ Configuring Logto...')
    await setupLogto()
    
    console.log('\n🎉 Setup Complete!')
    console.log('✅ NuxtShip is ready to use')
    console.log()
    console.log('🚀 Start your application: bun run dev')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('\n🔍 Troubleshooting:')
    console.log('   • Check that Docker is running')
    console.log('   • Ensure ports 80, 443, 3001, 5432 are available')
    console.log('   • Verify .env file contains required variables')
    process.exit(1)
  }
}

async function waitForLogto() {
  const authDomain = process.env.AUTH_DOMAIN
  if (!authDomain) {
    throw new Error('AUTH_DOMAIN not found in environment')
  }

  let attempts = 0
  const maxAttempts = 30 // 30 seconds
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://${authDomain}/console`, { 
        method: 'HEAD',
        headers: { 'User-Agent': 'NuxtShip-Setup' }
      })
      if (response.status < 500) {
        return
      }
    } catch (error) {
      // Service not ready yet
    }
    
    attempts++
    if (attempts >= maxAttempts) {
      throw new Error('Logto took too long to start up')
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function setupLogto() {
  const authDomain = process.env.AUTH_DOMAIN
  const appDomain = process.env.APP_DOMAIN
  const applicationName = process.env.APPLICATION_NAME || 'NuxtShip'

  if (!authDomain || !appDomain) {
    throw new Error('AUTH_DOMAIN and APP_DOMAIN must be set in .env')
  }

  console.log('🔐 Logto Application Setup')
  console.log('==========================')
  console.log()

  const managementAppId = process.env.LOGTO_MANAGEMENT_APP_ID
  const managementAppSecret = process.env.LOGTO_MANAGEMENT_APP_SECRET

  if (managementAppId && managementAppSecret) {
    console.log('🤖 Found management API credentials, using automatic setup...')
    try {
      await createApplicationAutomatically(authDomain, appDomain, applicationName, managementAppId, managementAppSecret)
      return
    } catch (error) {
      console.error('❌ Automatic setup failed:', error)
      console.log('📋 Falling back to manual setup...\n')
    }
  }

  // Manual setup flow
  await setupManually(authDomain, appDomain, applicationName)
}

async function setupManually(authDomain: string, appDomain: string, applicationName: string) {
  console.log('📋 Manual Application Setup Required')
  console.log()
  console.log('Please complete the following steps in the Logto Admin Console:')
  console.log(`🌐 Open: https://${process.env.ADMIN_DOMAIN || authDomain}`)
  console.log()
  
  if (await isFirstTimeSetup(authDomain)) {
    console.log('👤 First time setup:')
    console.log('   • Create your admin account')
    console.log('   • Complete the initial setup')
    console.log()
  }
  
  console.log('📱 Create application:')
  console.log('   1. Go to "Applications" → "Create application"')
  console.log('   2. Choose "Nuxt" (or "Traditional web app" if Nuxt option not available)')
  console.log(`   3. Name: ${applicationName}`)
  console.log('   4. Click "Create"')
  console.log()
  console.log('⚙️  Configure application:')
  console.log(`   5. Redirect URI: https://${appDomain}/auth/callback`)
  console.log(`   6. Post Sign-out URI: https://${appDomain}`)
  console.log('   7. Click "Save changes"')
  console.log()
  
  console.log('🔑 Copy the environment variables snippet from Logto:')
  console.log('   8. Go to the "Settings" tab of your application')
  console.log('   9. Copy the entire environment variables snippet')
  console.log('   10. Paste it into your .env file')
  console.log()
  console.log('🎉 Setup Complete!')
  console.log('✅ Infrastructure is running')
  console.log('✅ Logto admin console is accessible')
  console.log('✅ Application can be created and configured')
  console.log()
  console.log('🚀 Next steps:')
  console.log('   • Paste the Logto environment variables into your .env file')
  console.log('   • Start your application: bun run dev')
}

async function isFirstTimeSetup(authDomain: string): Promise<boolean> {
  try {
    // Try to access the API without authentication
    const response = await fetch(`https://${authDomain}/api/applications`, { method: 'HEAD' })
    return response.status === 401 // If we get 401, it means Logto is set up but we're not authenticated
  } catch {
    return true // Assume first time if we can't determine
  }
}

async function createApplicationAutomatically(
  authDomain: string,
  appDomain: string,
  applicationName: string,
  managementAppId: string,
  managementAppSecret: string
) {
  console.log('🤖 Creating application automatically...')

  // Get access token
  const tokenResponse = await fetch(`https://${authDomain}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: managementAppId,
      client_secret: managementAppSecret,
      scope: 'all',
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${tokenResponse.statusText} - ${error}`)
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token

  // Create application
  const appResponse = await fetch(`https://${authDomain}/api/applications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: applicationName,
      type: 'Traditional',
      oidcClientMetadata: {
        redirectUris: [`https://${appDomain}/auth/callback`],
        postLogoutRedirectUris: [`https://${appDomain}`],
      },
    }),
  })

  if (!appResponse.ok) {
    const error = await appResponse.text()
    throw new Error(`Failed to create application: ${appResponse.statusText} - ${error}`)
  }

  const application: LogtoApplication = await appResponse.json()

  await updateEnvFile(authDomain, application.id, application.secret)
  console.log('✅ Application created and configured automatically')
  console.log(`   • App ID: ${application.id}`)
  console.log('   • Configuration saved to .env file')
}

async function waitForUserConfirmation(message: string): Promise<void> {
  console.log(message)
  const decoder = new TextDecoder()
  for await (const chunk of Bun.stdin.stream()) {
    break // Exit on any input
  }
}



main().catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})