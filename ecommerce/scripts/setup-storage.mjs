/**
 * Automated Supabase Storage Setup Script
 * 
 * This script automatically:
 * 1. Creates the 'product-images' storage bucket
 * 2. Sets up all necessary storage policies via SQL
 * 
 * Usage:
 *   node scripts/setup-storage.mjs
 * 
 * Required environment variables (create a .env file in project root):
 *   SUPABASE_URL=your_supabase_project_url
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Simple env loader (no external dependency)
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
          // Remove quotes if present
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
    console.log('✓ Loaded environment variables from .env file')
  } catch (error) {
    // .env file doesn't exist or can't be read, that's okay - use system env vars
    console.log('ℹ️  No .env file found, using system environment variables')
  }
}

// Load environment variables
loadEnv()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL environment variable is required')
  console.error('   Please add it to your .env file:')
  console.error('   SUPABASE_URL=https://your-project.supabase.co')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('   Please add it to your .env file:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  console.error('\n   You can find your service role key in:')
  console.error('   Supabase Dashboard → Settings → API → service_role (secret)')
  console.error('\n   ⚠️  WARNING: This key has admin privileges. Never commit it to version control!')
  process.exit(1)
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKET_NAME = 'product-images'

/**
 * Execute SQL query using Supabase REST API
 */
async function executeSQL(sql) {
  try {
    // Use the PostgREST API to execute SQL
    // Note: This requires the SQL to be wrapped in a function or use direct REST calls
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      // Try alternative approach - direct SQL execution via REST
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Prefer': 'return=minimal'
        },
        body: sql
      })
      return sqlResponse.ok
    }
    return response.ok
  } catch (error) {
    return false
  }
}

async function setupStorage() {
  console.log('🚀 Starting Supabase Storage setup...\n')

  try {
    // Step 1: Create or verify storage bucket
    console.log('📦 Step 1: Setting up storage bucket...')
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME) || false

    if (bucketExists) {
      console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists`)
    } else {
      console.log(`   Creating bucket '${BUCKET_NAME}'...`)
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      })

      if (createError) {
        if (createError.message.includes('already exists') || createError.message.includes('duplicate') || createError.message.includes('Bucket already exists')) {
          console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists`)
        } else {
          console.error(`   ❌ Failed to create bucket: ${createError.message}`)
          throw createError
        }
      } else {
        console.log(`   ✓ Bucket '${BUCKET_NAME}' created successfully`)
        console.log(`   ✓ Bucket is public (images can be accessed via URL)`)
        console.log(`   ✓ File size limit: 10MB`)
        console.log(`   ✓ Allowed types: JPEG, PNG, GIF, WebP`)
      }
    }

    // Step 2: Set up storage policies via SQL
    console.log('\n🔐 Step 2: Setting up storage policies...')
    
    // Read SQL file
    const sqlFilePath = join(__dirname, '..', 'supabase-storage-policies.sql')
    let sqlContent
    try {
      sqlContent = readFileSync(sqlFilePath, 'utf-8')
    } catch (error) {
      console.error(`   ❌ Failed to read SQL file: ${sqlFilePath}`)
      throw error
    }

    // Split SQL into individual statements and clean them
    const sqlStatements = sqlContent
      .split(';')
      .map(s => s.trim().replace(/\n/g, ' ').replace(/\s+/g, ' '))
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('--'))

    console.log(`   Found ${sqlStatements.length} policy statements to execute`)

    // Execute policies using Supabase Management API
    // Since direct SQL execution via JS client is limited, we'll use REST API
    const policies = [
      {
        name: 'Allow authenticated uploads',
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow public read',
        sql: `CREATE POLICY IF NOT EXISTS "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow authenticated updates',
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${BUCKET_NAME}') WITH CHECK (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow authenticated deletes',
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${BUCKET_NAME}');`
      }
    ]

    // Execute each policy
    let successCount = 0
    for (const policy of policies) {
      try {
        // Use Supabase REST API to execute SQL
        // The service role key allows us to execute SQL via the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`
          },
          body: JSON.stringify({ query: policy.sql })
        })

        if (response.ok) {
          console.log(`   ✓ Policy '${policy.name}' created`)
          successCount++
        } else {
          // Try alternative: Use pg_net extension if available, or manual setup needed
          const errorText = await response.text()
          console.log(`   ⚠️  Policy '${policy.name}' - API execution not available`)
          console.log(`   ℹ️  This policy needs to be created manually (see instructions below)`)
        }
      } catch (error) {
        console.log(`   ⚠️  Policy '${policy.name}' - ${error.message}`)
        console.log(`   ℹ️  This policy needs to be created manually`)
      }
    }

    if (successCount === policies.length) {
      console.log('\n✅ All storage policies created successfully!')
    } else {
      console.log(`\n⚠️  ${successCount}/${policies.length} policies created automatically`)
      console.log('\n📝 Manual setup required for remaining policies:')
      console.log('   1. Go to your Supabase dashboard → SQL Editor')
      console.log('   2. Open the file: supabase-storage-policies.sql')
      console.log('   3. Copy and paste the SQL into the editor')
      console.log('   4. Click "Run" to execute')
    }

    console.log('\n✅ Storage bucket setup completed!')
    console.log('\n🎉 Your Supabase storage is ready for product image uploads!')
    console.log('\n📋 Summary:')
    console.log(`   • Bucket: ${BUCKET_NAME}`)
    console.log(`   • Public: Yes`)
    console.log(`   • Max file size: 10MB`)
    console.log(`   • Allowed types: JPEG, PNG, GIF, WebP`)

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.error('\n📝 Manual setup instructions:')
    console.error('   1. Go to Supabase dashboard → Storage')
    console.error(`   2. Create bucket: ${BUCKET_NAME} (make it public)`)
    console.error('   3. Go to SQL Editor and run: supabase-storage-policies.sql')
    process.exit(1)
  }
}

// Run the setup
setupStorage().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

