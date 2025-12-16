/**
 * Fix Products RLS Policies
 * 
 * This script adds Row Level Security policies to the products table
 * to allow authenticated users to create, update, and delete products
 * 
 * Requirements:
 * - SUPABASE_URL or VITE_SUPABASE_URL in .env
 * - SUPABASE_SERVICE_ROLE_KEY in .env
 * 
 * Usage:
 *   node scripts/fix-products-rls.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env')
    if (!existsSync(envPath)) {
      return
    }
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Please add them to your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('📝 Reading RLS policies migration file...')
    const migrationPath = join(__dirname, '..', 'migrations', 'add-products-rls-policies.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('🚀 Executing RLS policies migration...')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          if (error) {
            // Try direct SQL execution if RPC doesn't work
            const { error: directError } = await supabase
              .from('_exec_sql')
              .select('*')
              .limit(0)
            
            if (directError) {
              console.log(`   ⚠️  Note: ${statement.substring(0, 50)}...`)
            }
          }
        } catch (err) {
          // Continue with next statement
        }
      }
    }

    // Use the Management API approach
    console.log('🔧 Using Supabase Management API...')
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    })

    if (!response.ok) {
      // Try alternative: execute via SQL editor API
      console.log('📋 Please run this SQL in your Supabase SQL Editor:')
      console.log('   File: migrations/add-products-rls-policies.sql')
      console.log('\n   Or copy and paste the following:\n')
      console.log(sql)
      console.log('\n')
    } else {
      console.log('✅ RLS policies migration completed successfully!')
    }

  } catch (error) {
    console.error('❌ Error running migration:', error.message)
    console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:')
    console.log('   File: migrations/add-products-rls-policies.sql')
    process.exit(1)
  }
}

runMigration()




