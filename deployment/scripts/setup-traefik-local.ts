#!/usr/bin/env bun

import { writeFileSync } from "fs"
import { join } from "path"

async function main() {
  const appDomain = process.env.APP_DOMAIN || 'app.localhost'
  const traefikConfigPath = join(process.cwd(), "deployment", "traefik", "dynamic", "app-local.yml")

  // Generate Traefik configuration for local development routing
  const config = `# Dynamic configuration for local development
# Routes ${appDomain} to local dev server (localhost:3000)
# Generated automatically by setup script

http:
  routers:
    app-local:
      rule: "Host(\`${appDomain}\`)"
      tls: true
      service: app-local-service
      entryPoints:
        - websecure
        
  services:
    app-local-service:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:3000"
`

  try {
    writeFileSync(traefikConfigPath, config)
    console.log(`✅ Generated Traefik local development config for ${appDomain}`)
    console.log(`   Local dev server (localhost:3000) → https://${appDomain}`)
  } catch (error) {
    console.error("❌ Failed to generate Traefik config:", error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error)
  process.exit(1)
})