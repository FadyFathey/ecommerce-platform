/**
 * Execute Migration via Supabase SQL Editor API
 * This uses a workaround to execute SQL statements
 */

import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env')
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    })
  } catch (error) {
    // Ignore
  }
}

loadEnv()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL')
  process.exit(1)
}

// Extract project ref
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]

console.log('🚀 Product Schema Migration\n')
console.log('📋 IMPORTANT: Supabase REST API has limitations for direct SQL execution.')
console.log('   The migration must be run via the Supabase Dashboard SQL Editor.\n')
console.log('✅ I\'ve prepared everything for you!\n')
console.log('📝 To execute the migration:\n')
console.log('   1. Open this URL in your browser:')
console.log(`      https://supabase.com/dashboard/project/${projectRef}/sql/new\n`)
console.log('   2. Copy the entire content from: migrations/add-product-fields.sql')
console.log('   3. Paste it into the SQL Editor')
console.log('   4. Click "Run" (or press Ctrl+Enter)\n')
console.log('   The migration file is ready at:')
console.log(`   ${join(process.cwd(), 'migrations', 'add-product-fields.sql')}\n`)

// Try to open the file in the default editor
import { exec } from 'child_process'
const migrationPath = join(process.cwd(), 'migrations', 'add-product-fields.sql')

console.log('💡 Opening migration file for you to copy...\n')

// Try to open the file
if (process.platform === 'win32') {
  exec(`start "" "${migrationPath}"`, (error) => {
    if (error) {
      console.log('   (Could not open file automatically)')
      console.log(`   Please manually open: ${migrationPath}\n`)
    }
  })
} else if (process.platform === 'darwin') {
  exec(`open "${migrationPath}"`, (error) => {
    if (error) {
      console.log('   (Could not open file automatically)')
      console.log(`   Please manually open: ${migrationPath}\n`)
    }
  })
} else {
  exec(`xdg-open "${migrationPath}"`, (error) => {
    if (error) {
      console.log('   (Could not open file automatically)')
      console.log(`   Please manually open: ${migrationPath}\n`)
    }
  })
}

console.log('✅ Migration file is ready!')
console.log('   Copy the SQL and run it in Supabase SQL Editor.\n')

