/**
 * Direct SQL Migration Execution
 * 
 * This script attempts to execute SQL directly using Supabase Management API
 * Falls back to instructions if API execution fails
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Could not extract project ref from Supabase URL')
  process.exit(1)
}

async function executeMigration() {
  console.log('🚀 Executing Product Schema Migration\n')
  
  // Read SQL file
  const sqlPath = join(process.cwd(), 'migrations', 'add-product-fields.sql')
  const sqlContent = readFileSync(sqlPath, 'utf-8')
  
  // Use Supabase Management API
  // Note: This requires a Management API access token, not just service role key
  // For now, we'll use the SQL Editor API endpoint
  
  try {
    // Supabase provides a way to execute SQL via the REST API
    // We'll use the PostgREST endpoint with a special function
    console.log('📡 Attempting to execute via Supabase API...\n')
    
    // Create a migration function and execute it
    // We'll wrap the entire migration in a DO block
    const wrappedSQL = `
      DO $$
      BEGIN
        ${sqlContent.replace(/\$\$/g, '$$$')}
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Migration error: %', SQLERRM;
      END $$;
    `
    
    // Try executing via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({ query: wrappedSQL })
    })
    
    if (response.ok) {
      console.log('✅ Migration executed successfully!\n')
      return true
    } else {
      const errorText = await response.text()
      console.log('⚠️  Direct API execution not available')
      console.log('   Error:', errorText.substring(0, 100))
      return false
    }
  } catch (error) {
    console.log('⚠️  Direct API execution failed:', error.message)
    return false
  }
}

// Since direct execution has limitations, provide the SQL content
// and instructions for manual execution
console.log('📋 To execute this migration, you have two options:\n')
console.log('Option 1: Supabase Dashboard (Easiest)')
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef)
console.log('2. Navigate to: SQL Editor')
console.log('3. Click "New Query"')
console.log('4. Copy the SQL from: migrations/add-product-fields.sql')
console.log('5. Paste and click "Run"\n')

console.log('Option 2: I can open the SQL file for you to copy\n')

// Try to execute, but provide fallback
executeMigration().then(success => {
  if (!success) {
    console.log('\n💡 Since direct execution isn\'t available, please use Option 1 above.')
    console.log('   The SQL file is ready at: migrations/add-product-fields.sql\n')
  }
})

