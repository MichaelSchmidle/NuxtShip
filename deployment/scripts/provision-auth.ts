#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

interface MachineKey {
  type: string
  keyId: string
  key: string
  userId: string
}

interface ZitadelConfig {
  apiUrl: string
  domain: string
  projectName: string
  applicationName: string
  redirectUris: string[]
  postLogoutRedirectUris: string[]
}

// Constants - these are configurable for any application
const AUTH_CALLBACK_PATH = '/auth/zitadel/callback'

class ZitadelProvisioner {
  private config: ZitadelConfig
  private machineKey?: MachineKey
  private accessToken?: string

  constructor(config: ZitadelConfig) {
    this.config = config
  }

  async loadServiceAccount(): Promise<void> {
    const paths = [
      '/machinekey/app-provisioner.json', // Docker volume mount
      join(
        process.cwd(),
        'deployment',
        'zitadel',
        'machinekey',
        'app-provisioner.json'
      ), // Local dev
    ]

    for (const path of paths) {
      try {
        const machineKeyContent = await readFile(path, 'utf-8')
        this.machineKey = JSON.parse(machineKeyContent)
        // Service account loaded successfully
        return
      } catch {
        // Try next path
      }
    }

    throw new Error(
      'Failed to load machine key. Make sure:\n' +
        '1. Zitadel is running (bun run dev:start)\n' +
        "2. The service account 'app-provisioner' exists in Zitadel\n" +
        '3. The machine key file exists in one of the expected locations'
    )
  }

  async authenticate(): Promise<void> {
    if (!this.machineKey) {
      throw new Error('Machine key not loaded')
    }

    // Note: JWT creation is prepared for future use when we implement
    // proper JWT signing. For now, we'll use the PAT if available
    const patPaths = [
      '/pat/app-provisioner.pat', // Docker volume mount
      join(
        process.cwd(),
        'deployment',
        'zitadel',
        'pat',
        'app-provisioner.pat'
      ), // Local dev
    ]

    for (const path of patPaths) {
      try {
        const pat = await readFile(path, 'utf-8')
        this.accessToken = pat.trim()
        // Using PAT for authentication
        return
      } catch {
        // Try next path
      }
    }

    throw new Error(
      'Failed to load PAT. Make sure:\n' +
        "1. The service account 'app-provisioner' exists in Zitadel\n" +
        '2. A Personal Access Token has been created for the service account\n' +
        '3. The PAT file exists in one of the expected locations'
    )
  }

  async findProject(): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${this.config.apiUrl}/management/v1/projects/_search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              nameQuery: {
                name: this.config.projectName,
                method: 'TEXT_QUERY_METHOD_EQUALS',
              },
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to search for project: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    const result = await response.json()
    if (result.result && result.result.length > 0) {
      const project = result.result[0]
      // Found existing project
      return project.id
    }

    return null
  }

  async createProject(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // Check if project already exists
    const existingProjectId = await this.findProject()
    if (existingProjectId) {
      return existingProjectId
    }

    const response = await fetch(
      `${this.config.apiUrl}/management/v1/projects`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.config.projectName,
          projectRoleAssertion: true,
          projectRoleCheck: true,
          hasProjectCheck: true,
          privateLabelingSetting:
            'PRIVATE_LABELING_SETTING_ALLOW_LOGIN_USER_RESOURCE_OWNER_POLICY',
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to create project: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    const result = await response.json()
    // Project created successfully
    return result.id
  }

  async findApplication(projectId: string): Promise<unknown | null> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `${this.config.apiUrl}/management/v1/projects/${projectId}/apps/_search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              nameQuery: {
                name: this.config.applicationName,
                method: 'TEXT_QUERY_METHOD_EQUALS',
              },
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to search for application: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    const result = await response.json()
    if (result.result && result.result.length > 0) {
      const app = result.result[0]
      // Found existing application
      return app
    }

    return null
  }

  async createApplication(projectId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // Check if application already exists
    const existingApp = await this.findApplication(projectId)
    if (existingApp) {
      console.log(
        `Note: Using existing application. Delete from Zitadel console to generate new credentials.`
      )
      return
    }

    // Create OIDC Web Application
    const response = await fetch(
      `${this.config.apiUrl}/management/v1/projects/${projectId}/apps/oidc`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.config.applicationName,
          redirectUris: this.config.redirectUris,
          postLogoutRedirectUris: this.config.postLogoutRedirectUris,
          responseTypes: ['OIDC_RESPONSE_TYPE_CODE'],
          grantTypes: [
            'OIDC_GRANT_TYPE_AUTHORIZATION_CODE',
            'OIDC_GRANT_TYPE_REFRESH_TOKEN',
          ],
          appType: 'OIDC_APP_TYPE_WEB',
          authMethodType: 'OIDC_AUTH_METHOD_TYPE_NONE', // PKCE for Web Apps
          version: 'OIDC_VERSION_1_0',
          clockSkew: '5s',
          devMode: process.env.NODE_ENV === 'development',
          accessTokenType: 'OIDC_ACCESS_TOKEN_TYPE_JWT',
          accessTokenRoleAssertion: true,
          idTokenRoleAssertion: true,
          idTokenUserInfoAssertion: true,
          additionalOrigins: [],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to create application: ${response.status} ${response.statusText}\n${errorText}`
      )
    }

    const result = await response.json()
    console.log(`✓ Created application with Client ID: ${result.clientId}`)

    // Save credentials to a secure location
    const credentials = {
      clientId: result.clientId,
      issuer: `https://${this.config.domain}`,
      projectId: projectId,
      applicationId: result.appId,
      redirectUri: this.config.redirectUris[0],
      postLogoutRedirectUri: this.config.postLogoutRedirectUris[0],
    }

    // Update .env file with the new credentials
    await this.updateEnvFile({
      NUXT_OIDC_PROVIDERS_ZITADEL_CLIENT_ID: credentials.clientId,
      NUXT_OIDC_PROVIDERS_ZITADEL_BASE_URL: credentials.issuer,
      NUXT_OIDC_PROVIDERS_ZITADEL_REDIRECT_URI: credentials.redirectUri,
      NUXT_OIDC_PROVIDERS_ZITADEL_LOGOUT_REDIRECT_URI:
        credentials.postLogoutRedirectUri,
    })

    console.log('\n✅ Updated .env file with OIDC configuration')
  }

  async updateEnvFile(variables: Record<string, string>): Promise<void> {
    const envPath = join(process.cwd(), '.env')

    // Read existing .env file
    let envContent = ''
    try {
      envContent = await readFile(envPath, 'utf-8')
    } catch {
      throw new Error(
        '.env file not found. Please create one from .env.example first.'
      )
    }

    // Update or add each variable
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(envContent)) {
        // Update existing variable
        envContent = envContent.replace(regex, `${key}="${value}"`)
      } else {
        // Add new variable at the end
        envContent += `\n${key}="${value}"`
      }
    }

    // Write back to file
    await writeFile(envPath, envContent)
  }

  async waitForZitadel(): Promise<void> {
    console.log('⏳ Waiting for Zitadel to be ready...')
    const maxRetries = 30
    const retryInterval = 2000 // 2 seconds

    // First wait for basic health check
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${this.config.apiUrl}/debug/ready`)
        if (response.ok) {
          break
        }
      } catch {
        // Expected to fail while starting up
      }

      if (i === maxRetries - 1) {
        console.error(`\n❌ Unable to connect to Zitadel at ${this.config.apiUrl}/debug/ready after ${maxRetries * retryInterval / 1000} seconds.

Possible causes:
• Network connectivity issues
• DNS resolution not working (check if ${this.config.domain} resolves)
• Zitadel container still starting up  
• Firewall or proxy blocking the connection
• Certificate issues

Troubleshooting:
1. Check container status: bun run infra:status
2. View container logs: bun run infra:logs zitadel
3. Test connectivity: curl ${this.config.apiUrl}/debug/ready

Once resolved, resume provisioning with:
  bun run setup:auth:provision
`)
        process.exit(1)
      }

      process.stdout.write('.')
      await new Promise((resolve) => setTimeout(resolve, retryInterval))
    }

    console.log('\n⏳ Waiting for API to be fully ready...')

    // Now wait for the actual API to be available by testing with service account
    await this.loadServiceAccount()
    await this.authenticate()

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Test the API by trying to list projects (lightweight call)
        const response = await fetch(
          `${this.config.apiUrl}/management/v1/projects/_search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              queries: [],
              limit: 1,
            }),
          }
        )

        if (response.ok) {
          console.log(' Ready!')
          return
        }
      } catch {
        // Expected to fail while API is starting up
      }

      process.stdout.write('.')
      await new Promise((resolve) => setTimeout(resolve, retryInterval))
    }

    throw new Error('Timeout waiting for Zitadel API to be ready')
  }

  async getAdminUser(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // Search for the admin user by email
    const adminEmail = process.env.ZITADEL_ADMIN_EMAIL || 'admin@example.com'

    const response = await fetch(
      `${this.config.apiUrl}/management/v1/users/_search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              emailQuery: {
                emailAddress: adminEmail,
                method: 'TEXT_QUERY_METHOD_EQUALS',
              },
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to find admin user: ${error}`)
    }

    const result = await response.json()
    if (result.result && result.result.length > 0) {
      const adminUser = result.result[0]
      // Found admin user
      return adminUser.id
    }

    throw new Error(`Admin user with email ${adminEmail} not found`)
  }

  async createUserGrant(projectId: string, userId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // Check if user grant already exists
    const searchResponse = await fetch(
      `${this.config.apiUrl}/management/v1/users/grants/_search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [
            {
              projectIdQuery: {
                projectId: projectId,
              },
            },
            {
              userIdQuery: {
                userId: userId,
              },
            },
          ],
        }),
      }
    )

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json()
      if (searchResult.result && searchResult.result.length > 0) {
        // Admin user already authorized
        return
      }
    }

    // Create user grant (authorization) for the admin user
    const response = await fetch(
      `${this.config.apiUrl}/management/v1/users/${userId}/grants`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          roleKeys: [], // Empty array means grant access without specific roles
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create user grant: ${error}`)
    }

    // Created user authorization
  }

  async configureExternalLink(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    // Configure custom link pointing back to the app domain
    const projectName = process.env.PROJECT_NAME || 'myapp'
    const appDomain = process.env.APP_DOMAIN || 'app.localhost'
    const appBaseUrl = `https://${appDomain}`

    const response = await fetch(
      `${this.config.apiUrl}/management/v1/policies/privacy`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customLink: appBaseUrl,
          customLinkText: projectName,
        }),
      }
    )

    if (!response.ok) {
      // Check if it's already configured by trying to update instead
      const updateResponse = await fetch(
        `${this.config.apiUrl}/management/v1/policies/privacy`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customLink: appBaseUrl,
            customLinkText: projectName,
          }),
        }
      )

      if (!updateResponse.ok) {
        const error = await response.text()
        console.log(`Note: Could not configure custom link: ${error}`)
        // Don't fail the entire provisioning process for this optional feature
        return
      }
    }
  }

  async provision(): Promise<void> {
    console.log('🚀 Provisioning Zitadel...')

    // Get project configuration from environment
    const projectName = process.env.PROJECT_NAME || 'myapp'
    const _applicationName =
      process.env.PROJECT_DISPLAY_NAME || `${projectName} Web App`

    try {
      await this.waitForZitadel()
      console.log('')

      // Get admin user ID
      const adminUserId = await this.getAdminUser()

      // Create project
      const projectId = await this.createProject()

      // Create user grant (authorization) for admin user
      await this.createUserGrant(projectId, adminUserId)

      // Create application
      await this.createApplication(projectId)

      // Configure external links pointing back to the app
      await this.configureExternalLink()

      console.log('\n✅ Provisioning completed successfully!')
    } catch {
      console.error('\n❌ Provisioning failed:', error)
      process.exit(1)
    }
  }
}

// Helper function to construct URLs
function buildUrls(appDomain: string) {
  const appBaseUrl = `https://${appDomain}`
  return {
    redirectUri: `${appBaseUrl}${AUTH_CALLBACK_PATH}`,
    postLogoutRedirectUri: appBaseUrl,
  }
}

// Main execution
async function main() {
  // Get project configuration
  const projectName = process.env.PROJECT_NAME || 'myapp'
  const applicationName =
    process.env.PROJECT_DISPLAY_NAME || `${projectName} Web App`

  // Use configured domains or .localhost defaults
  const authDomain = process.env.AUTH_DOMAIN || 'auth.localhost'
  const appDomain = process.env.APP_DOMAIN || 'app.localhost'

  // Build URLs using helper function
  const urls = buildUrls(appDomain)

  // Add test domain for Docker container testing
  const testDomain = process.env.APP_TEST_DOMAIN || 'app-test.localhost'
  const testUrls = buildUrls(testDomain)

  const config: ZitadelConfig = {
    apiUrl: `https://${authDomain}`,
    domain: authDomain,
    projectName: projectName,
    applicationName: applicationName,
    redirectUris: [urls.redirectUri, testUrls.redirectUri],
    postLogoutRedirectUris: [
      urls.postLogoutRedirectUri,
      testUrls.postLogoutRedirectUri,
    ],
  }

  // Configuration is ready

  const provisioner = new ZitadelProvisioner(config)
  await provisioner.provision()
}

main().catch(() => {
  console.error('❌ Provisioning failed')
  process.exit(1)
})
