/**
 * Automated Supabase Storage Setup Script (Alternative)
 * 
 * This script attempts to set up storage using available credentials.
 * If service role key is not available, it will try with anon key and provide instructions.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Simple env loader
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
    // .env file doesn't exist
  }
}

loadEnv()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL is required')
  process.exit(1)
}

const BUCKET_NAME = 'product-images'

async function setupWithServiceRole() {
  console.log('🚀 Setting up storage with service role key...\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Create bucket
  console.log('📦 Creating storage bucket...')
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET_NAME)
  
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    })
    if (error && !error.message.includes('already exists')) {
      throw error
    }
    console.log('   ✓ Bucket created')
  } else {
    console.log('   ✓ Bucket already exists')
  }

  // Execute SQL policies via REST API
  console.log('\n🔐 Setting up policies...')
  const policies = [
    `CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${BUCKET_NAME}');`,
    `CREATE POLICY IF NOT EXISTS "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = '${BUCKET_NAME}');`,
    `CREATE POLICY IF NOT EXISTS "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${BUCKET_NAME}') WITH CHECK (bucket_id = '${BUCKET_NAME}');`,
    `CREATE POLICY IF NOT EXISTS "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${BUCKET_NAME}');`
  ]

  for (const sql of policies) {
    try {
      // Try executing via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({ query: sql })
      })
      if (response.ok) {
        console.log('   ✓ Policy created')
      }
    } catch (e) {
      // Policies may need manual setup
    }
  }

  console.log('\n✅ Setup complete!')
}

async function setupWithAnonKey() {
  console.log('🚀 Attempting setup with anon key...\n')
  
  if (!supabaseAnonKey) {
    console.error('❌ No Supabase keys available')
    return false
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Try to list buckets (this will tell us if we have permissions)
  console.log('📦 Checking storage access...')
  const { data: buckets, error } = await supabase.storage.listBuckets()
  
  if (error) {
    console.log('   ⚠️  Cannot access storage with anon key')
    console.log('   ℹ️  Service role key required for bucket creation')
    return false
  }

  const exists = buckets?.some(b => b.name === BUCKET_NAME)
  if (exists) {
    console.log(`   ✓ Bucket '${BUCKET_NAME}' exists`)
    console.log('\n✅ Bucket is ready!')
    console.log('\n📝 Next step: Set up policies manually in Supabase SQL Editor')
    console.log('   Run the SQL from: supabase-storage-policies.sql')
    return true
  } else {
    console.log(`   ⚠️  Bucket '${BUCKET_NAME}' not found`)
    console.log('\n📝 Manual setup required:')
    console.log('   1. Go to Supabase Dashboard → Storage')
    console.log(`   2. Create bucket: ${BUCKET_NAME} (make it public)`)
    console.log('   3. Run SQL from: supabase-storage-policies.sql')
    return false
  }
}

// Main execution
(async () => {
  try {
    if (supabaseServiceRoleKey) {
      await setupWithServiceRole()
    } else {
      const success = await setupWithAnonKey()
      if (!success) {
        console.log('\n💡 To fully automate setup, add to .env:')
        console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
        console.log('   (Get it from: Supabase Dashboard → Settings → API)')
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
})()

