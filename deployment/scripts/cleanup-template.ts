#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

async function cleanupTemplate(): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json')
  
  try {
    // Read current package.json
    const packageContent = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    // Check if this is still the template repository
    if (packageJson.name === 'nuxtship') {
      console.log('📦 Template repository detected - keeping all commands')
      return
    }
    
    console.log('🧹 User project detected - cleaning up template commands...')
    
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
      'setup:auth'
    ]
    
    let removedCount = 0
    commandsToRemove.forEach(cmd => {
      if (scripts[cmd]) {
        delete scripts[cmd]
        removedCount++
      }
    })
    
    // Rename container commands to be more user-friendly
    if (scripts['containers:start']) {
      scripts['infra:start'] = scripts['containers:start']
      delete scripts['containers:start']
    }
    
    if (scripts['containers:stop']) {
      scripts['infra:stop'] = scripts['containers:stop']
      delete scripts['containers:stop']
    }
    
    if (scripts['containers:restart']) {
      scripts['infra:restart'] = scripts['containers:restart']
      delete scripts['containers:restart']
    }
    
    if (scripts['containers:logs']) {
      scripts['infra:logs'] = scripts['containers:logs']
      delete scripts['containers:logs']
    }
    
    if (scripts['containers:status']) {
      scripts['infra:status'] = scripts['containers:status']
      delete scripts['containers:status']
    }
    
    // Update package.json
    packageJson.scripts = scripts
    
    // Write back to file
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    
    console.log(`✅ Cleaned up ${removedCount} template commands`)
    console.log('📝 Renamed container commands to infra:* pattern')
    console.log('🚀 Your project is ready for development!')
    
  } catch (error) {
    console.error('❌ Failed to cleanup template:', error.message)
    // Don't fail the entire init process for cleanup issues
  }
}

// Only run if called directly
if (import.meta.main) {
  cleanupTemplate()
}