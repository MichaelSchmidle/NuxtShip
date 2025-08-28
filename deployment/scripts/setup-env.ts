#!/usr/bin/env bun

import { existsSync, copyFileSync } from "fs"
import { join } from "path"

async function main() {
  const envPath = join(process.cwd(), ".env")
  const envExamplePath = join(process.cwd(), ".env.example")

  // Check if .env already exists
  if (existsSync(envPath)) {
    console.log("✅ .env file found, continuing with setup...")
    return
  }

  // Check if .env.example exists
  if (!existsSync(envExamplePath)) {
    console.error("❌ .env.example file not found!")
    console.error("   This template may be corrupted.")
    process.exit(1)
  }

  // Copy .env.example to .env
  try {
    copyFileSync(envExamplePath, envPath)
    console.log("✅ Copied .env.example to .env")
  } catch (error) {
    console.error("❌ Failed to copy .env.example to .env:", error)
    process.exit(1)
  }

  // Stop and provide guidance
  console.log("\n⚠️  Please configure your .env file before continuing:\n")
  
  console.log("📋 Required settings:")
  console.log("   • PROJECT_NAME - Your project identifier")
  console.log("   • Database passwords (APP_DB_PASSWORD, LOGTO_DB_PASSWORD)")
  console.log("   • SMTP configuration (optional for email notifications)")
  console.log("   • Logto secrets (will be set after provisioning):")
  console.log("     - NUXT_LOGTO_APP_ID: From Logto Admin Console")
  console.log("     - NUXT_LOGTO_APP_SECRET: From Logto Admin Console") 
  console.log("     - NUXT_LOGTO_COOKIE_ENCRYPTION_KEY: openssl rand -hex 32")
  
  console.log("\n💡 Optional settings:")
  console.log("   • Domain configuration (defaults to *.localhost)")
  console.log("   • Branding colors")
  console.log("   • Nuxt UI Pro license")
  
  console.log("\n🚀 After configuring .env, run:")
  console.log("   bun run init")
  
  process.exit(1)
}

main().catch((error) => {
  console.error("❌ Setup failed:", error)
  process.exit(1)
})