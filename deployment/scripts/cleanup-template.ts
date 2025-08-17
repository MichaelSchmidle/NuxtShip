#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

async function hasUncommittedChanges(): Promise<boolean> {
  try {
    // Check for uncommitted changes to files we would modify
    const result = execSync(
      'git status --porcelain package.json deployment/scripts/cleanup-template.ts 2>/dev/null',
      { encoding: 'utf-8' }
    )
    
    if (result.trim()) {
      console.log('⚠️  Uncommitted changes detected - skipping cleanup to protect your work')
      console.log('   Commit or stash your changes first if you want to run cleanup')
      return true
    }
    return false
  } catch {
    // No git or not a git repo - safe to proceed (likely from nuxi init)
    return false
  }
}

async function cleanupTemplateCommands(): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json')
  
  try {
    console.log('🧹 Cleaning up template commands...')
    
    // Read current package.json
    const packageContent = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    // Remove template-specific commands but keep runtime commands
    const scripts = packageJson.scripts || {}
    
    // Commands to remove (template setup only)
    const commandsToRemove = [
      'init',
      'setup:env',
      'setup:full', 
      'setup:certs',
      'setup:init-steps',
      'setup:containers',
      'setup:database',
      'setup:auth',
      'setup:auth:provision'
    ]
    
    let removedCount = 0
    commandsToRemove.forEach(cmd => {
      if (scripts[cmd]) {
        delete scripts[cmd]
        removedCount++
      }
    })
    
    // Rename container commands to be more user-friendly
    const renames = {
      'containers:start': 'infra:start',
      'containers:stop': 'infra:stop',
      'containers:restart': 'infra:restart',
      'containers:logs': 'infra:logs',
      'containers:status': 'infra:status'
    }
    
    Object.entries(renames).forEach(([oldName, newName]) => {
      if (scripts[oldName]) {
        scripts[newName] = scripts[oldName]
        delete scripts[oldName]
      }
    })
    
    // Update package.json
    packageJson.scripts = scripts
    
    // Write back to file
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    
    console.log(`✅ Cleaned up ${removedCount} template commands`)
    console.log('📝 Renamed container commands to infra:* pattern')
    
  } catch (error) {
    console.error('❌ Failed to cleanup template commands:', error.message)
    // Don't fail the entire init process for cleanup issues
  }
}

async function updatePackageInfo(): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json')
  const envPath = join(process.cwd(), '.env')
  
  try {
    // Read project name from .env
    const envContent = await readFile(envPath, 'utf-8')
    const projectNameMatch = envContent.match(/^PROJECT_NAME=(.*)$/m)
    
    if (!projectNameMatch) {
      console.log('⚠️  No PROJECT_NAME found in .env - skipping package.json update')
      return
    }
    
    const projectName = projectNameMatch[1].trim()
    
    // Read and update package.json
    const packageContent = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    // Update name (convert to lowercase, replace spaces with hyphens per npm conventions)
    const npmName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    packageJson.name = npmName
    
    // Clear the template description
    delete packageJson.description
    
    // Remove template version to start fresh
    packageJson.version = '0.1.0'
    
    // Write back to file
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    
    console.log(`📦 Updated package.json with project name: ${npmName}`)
    
  } catch (error) {
    console.error('❌ Failed to update package info:', error.message)
    // Don't fail the entire init process
  }
}

async function main(): Promise<void> {
  // First check for uncommitted changes
  const hasChanges = await hasUncommittedChanges()
  
  if (!hasChanges) {
    // Clean up template commands FIRST (before any modifications)
    await cleanupTemplateCommands()
  }
  
  // Then update package.json with project info
  // This happens regardless of cleanup
  await updatePackageInfo()
  
  if (!hasChanges) {
    console.log('🚀 Your project is ready for development!')
  }
}

// Only run if called directly
if (import.meta.main) {
  main()
}