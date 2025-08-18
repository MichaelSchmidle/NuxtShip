#!/usr/bin/env bun

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { execSync } from 'child_process'

async function isTemplateRepo(): Promise<boolean> {
  const packageJsonPath = join(process.cwd(), 'package.json')
  
  try {
    // Read current package.json to check if we're still in the template
    const packageContent = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageContent)
    
    // If package name is still "nuxtship", we're in the template repo
    // (or user named their project identically - in which case, no harm in skipping cleanup)
    if (packageJson.name === 'nuxtship') {
      console.log('⚠️  Template repository detected - skipping cleanup to preserve template')
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to check if template repo:', error.message)
    // If we can't read package.json, assume it's safe to proceed
    return false
  }
}

async function cleanupTemplateCommands(): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json')
  
  try {
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
    
    // No renaming needed - commands are already named correctly
    
    // Update package.json
    packageJson.scripts = scripts
    
    // Write back to file
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
    
  } catch (error) {
    console.error('❌ Failed to cleanup template commands:', error.message)
    // Don't fail the entire init process for cleanup issues
  }
}

async function cleanupReadme(): Promise<void> {
  const readmePath = join(process.cwd(), 'README.md')
  const envPath = join(process.cwd(), '.env')
  
  try {
    // Get project name from .env
    const envContent = await readFile(envPath, 'utf-8')
    const projectNameMatch = envContent.match(/^PROJECT_NAME=(.*)$/m)
    const appNameMatch = envContent.match(/^APPLICATION_NAME=(.*)$/m)
    
    const projectName = projectNameMatch?.[1]?.trim().replace(/['"]/g, '') || 'My App'
    const appName = appNameMatch?.[1]?.trim().replace(/['"]/g, '') || projectName
    
    // Read current README
    let readme = await readFile(readmePath, 'utf-8')
    
    // Replace title and tagline
    readme = readme.replace(
      /# 🚀 NuxtShip\n\n\*\*Skip the auth boilerplate\. Ship your idea faster\.\*\*/,
      `# ${appName}\n\nBuilt with NuxtShip - Authentication and infrastructure included.`
    )
    
    // Remove the entire Quick Start section (installation instructions)
    readme = readme.replace(
      /## 🚀 Quick Start[\s\S]*?(?=## |$)/,
      ''
    )
    
    // Remove Contributing section
    readme = readme.replace(
      /## 🤝 Contributing[\s\S]*?(?=## |---\n|$)/,
      ''
    )
    
    // Remove License section (users choose their own license)
    readme = readme.replace(
      /## 📝 License[\s\S]*?(?=## |---\n|$)/,
      ''
    )
    
    // Update directory structure to use project name instead of "my-awesome-app"
    readme = readme.replace(
      /my-awesome-app\//g,
      `${projectName.toLowerCase().replace(/\s+/g, '-')}/`
    )
    
    // Update footer attribution
    readme = readme.replace(
      'Made with ❤️ and',
      'Built with NuxtShip and powered by'
    )
    
    // Write updated README
    await writeFile(readmePath, readme)
    
    console.log(`📝 Updated README.md for ${appName}`)
    
  } catch (error) {
    console.error('❌ Failed to cleanup README:', error.message)
    // Don't fail the entire init process
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
  // First update package.json with project info
  // This changes the package name from "nuxtship" to the project name
  await updatePackageInfo()
  
  // Then check if we're in the template repository
  const isTemplate = await isTemplateRepo()
  
  if (!isTemplate) {
    // Only clean up if we're NOT in the template repo
    await cleanupTemplateCommands()
    await cleanupReadme()
    console.log('🚀 Your project is ready for development!')
  }
}

// Only run if called directly
if (import.meta.main) {
  main()
}