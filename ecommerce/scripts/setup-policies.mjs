/**
 * Execute storage policies SQL directly
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

const BUCKET_NAME = 'product-images'

// SQL statements to execute
const policies = [
  `CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${BUCKET_NAME}');`,
  `CREATE POLICY IF NOT EXISTS "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = '${BUCKET_NAME}');`,
  `CREATE POLICY IF NOT EXISTS "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${BUCKET_NAME}') WITH CHECK (bucket_id = '${BUCKET_NAME}');`,
  `CREATE POLICY IF NOT EXISTS "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${BUCKET_NAME}');`
]

async function executePolicies() {
  console.log('🔐 Setting up storage policies via SQL...\n')
  
  for (let i = 0; i < policies.length; i++) {
    const sql = policies[i]
    const policyNames = [
      'Allow authenticated uploads',
      'Allow public read',
      'Allow authenticated updates',
      'Allow authenticated deletes'
    ]
    
    try {
      // Try using PostgREST to execute SQL
      // First, we need to create a function that can execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      })

      if (response.ok) {
        console.log(`   ✓ Policy '${policyNames[i]}' created`)
      } else {
        const errorText = await response.text()
        console.log(`   ⚠️  Policy '${policyNames[i]}' - ${response.status}: ${errorText.substring(0, 100)}`)
        console.log(`   ℹ️  This policy needs to be created manually`)
      }
    } catch (error) {
      console.log(`   ⚠️  Policy '${policyNames[i]}' - ${error.message}`)
    }
  }
  
  console.log('\n📝 If policies weren\'t created automatically, run this SQL in Supabase SQL Editor:')
  console.log('   File: supabase-storage-policies.sql\n')
}

executePolicies()

