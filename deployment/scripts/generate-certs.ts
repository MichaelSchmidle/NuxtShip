#!/usr/bin/env bun

import { existsSync, mkdirSync } from "fs"
import { join } from "path"
import { $ } from "bun"
import { platform } from "os"

async function checkMkcertInstalled(): Promise<boolean> {
  try {
    await $`mkcert -version`.quiet()
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log("🔒 Generating SSL certificates...")

  // Check if mkcert is installed
  const mkcertInstalled = await checkMkcertInstalled()
  if (!mkcertInstalled) {
    console.error("❌ mkcert is not installed. Please install it first:")
    console.error("   Visit: https://mkcert.dev")

    // Platform-specific installation hints
    const os = platform()
    if (os === "darwin") {
      console.error("   macOS: brew install mkcert")
    } else if (os === "win32") {
      console.error("   Windows: choco install mkcert or scoop install mkcert")
    } else if (os === "linux") {
      console.error("   Linux: Follow instructions at https://mkcert.dev")
    }

    console.error("")
    process.exit(1)
  }

  // Create certs directory if it doesn't exist
  const certsDir = join(process.cwd(), "deployment", "traefik", "certs")
  if (!existsSync(certsDir)) {
    mkdirSync(certsDir, { recursive: true })
  }

  // Install the local CA if not already done
  try {
    await $`mkcert -install`.quiet()
  } catch {
    console.error("⚠️  Warning: Failed to install local CA. You may need to run with elevated privileges.")
    console.error("   On Windows: Run as Administrator")
    console.error("   On macOS/Linux: You may be prompted for your password")
  }

  // Generate certificates for our domains

  // Change to certs directory
  process.chdir(certsDir)

  // Get domains from environment or use localhost defaults
  const appDomain = process.env.APP_DOMAIN || 'app.localhost'
  const _authDomain = process.env.AUTH_DOMAIN || 'auth.localhost'
  const _proxyDomain = process.env.PROXY_DOMAIN || 'proxy.localhost'
  
  // Extract base domain (e.g., 'localhost' from 'app.localhost')
  const baseDomain = appDomain.split('.').slice(1).join('.') || 'localhost'
  
  // Generate wildcard certificate for the base domain
  await $`mkcert "*.${baseDomain}" ${baseDomain} localhost 127.0.0.1 ::1`.quiet()

  // Find and rename the generated files
  // mkcert generates files with names like _wildcard.dev.myapp.com+3.pem
  const files = await $`ls -1`.text()
  const certFiles = files.split('\n').filter((f: string) => f.endsWith('.pem'))

  let certFile = ''
  let keyFile = ''

  for (const file of certFiles) {
    if (file.includes('-key.pem')) {
      keyFile = file.trim()
    } else if (file.endsWith('.pem')) {
      certFile = file.trim()
    }
  }

  if (certFile && keyFile) {
    // Rename files to standard names
    // Use a generic name that works for any domain
    await $`mv ${certFile} cert.crt`
    await $`mv ${keyFile} cert.key`

    console.log("✅ SSL certificates generated successfully in deployment/traefik/certs/")
  } else {
    console.error("❌ Failed to find generated certificate files")
    process.exit(1)
  }

  // Certificates ready
}

main().catch((error) => {
  console.error("❌ Error:", error)
  process.exit(1)
})