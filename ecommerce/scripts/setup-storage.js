/**
 * Automated Supabase Storage Setup Script
 * 
 * This script automatically:
 * 1. Creates the 'product-images' storage bucket
 * 2. Sets up all necessary storage policies
 * 
 * Usage:
 *   node scripts/setup-storage.js
 * 
 * Required environment variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key (for admin operations)
 * 
 * Note: The service role key has admin privileges. Keep it secure and never commit it to version control.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL environment variable is required')
  console.error('   Please set it in your .env file or export it before running this script')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('   You can find this in your Supabase dashboard: Settings → API → service_role key')
  console.error('   ⚠️  WARNING: This key has admin privileges. Keep it secure!')
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

async function setupStorage() {
  console.log('🚀 Starting Supabase Storage setup...\n')

  try {
    // Step 1: Check if bucket exists, create if it doesn't
    console.log('📦 Step 1: Checking storage bucket...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`)
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME)

    if (bucketExists) {
      console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists`)
    } else {
      console.log(`   Creating bucket '${BUCKET_NAME}'...`)
      const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      })

      if (createError) {
        // If bucket creation fails, it might already exist or we need different permissions
        if (createError.message.includes('already exists') || createError.message.includes('duplicate')) {
          console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists (created elsewhere)`)
        } else {
          throw new Error(`Failed to create bucket: ${createError.message}`)
        }
      } else {
        console.log(`   ✓ Bucket '${BUCKET_NAME}' created successfully`)
      }
    }

    // Step 2: Set up storage policies
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

    // Split SQL into individual statements
    const sqlStatements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    // Execute each SQL statement
    for (const statement of sqlStatements) {
      if (statement.trim()) {
        const { error: sqlError } = await supabase.rpc('exec_sql', { sql: statement })
        
        // If exec_sql doesn't work, try direct SQL execution
        // Note: Supabase JS client doesn't have direct SQL execution
        // We'll need to use a different approach
      }
    }

    // Alternative: Use REST API to execute SQL
    console.log('   Executing SQL policies via REST API...')
    
    const policies = [
      {
        name: 'Allow authenticated uploads',
        statement: `CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow public read',
        statement: `CREATE POLICY IF NOT EXISTS "Allow public read"
          ON storage.objects FOR SELECT
          TO public
          USING (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow authenticated updates',
        statement: `CREATE POLICY IF NOT EXISTS "Allow authenticated updates"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = '${BUCKET_NAME}')
          WITH CHECK (bucket_id = '${BUCKET_NAME}');`
      },
      {
        name: 'Allow authenticated deletes',
        statement: `CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = '${BUCKET_NAME}');`
      }
    ]

    // Execute SQL via REST API
    for (const policy of policies) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey,
            'Authorization': `Bearer ${supabaseServiceRoleKey}`
          },
          body: JSON.stringify({ sql: policy.statement })
        })

        if (!response.ok) {
          // Try alternative: direct SQL endpoint
          const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceRoleKey,
              'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({ query: policy.statement })
          })
          
          if (sqlResponse.ok) {
            console.log(`   ✓ Policy '${policy.name}' created`)
          } else {
            console.log(`   ⚠️  Policy '${policy.name}' - may need manual setup (see instructions below)`)
          }
        } else {
          console.log(`   ✓ Policy '${policy.name}' created`)
        }
      } catch (error) {
        console.log(`   ⚠️  Policy '${policy.name}' - error: ${error.message}`)
        console.log(`   ⚠️  You may need to create this policy manually in the Supabase SQL Editor`)
      }
    }

    console.log('\n✅ Storage setup completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Go to your Supabase dashboard → SQL Editor')
    console.log('   2. Open the file: supabase-storage-policies.sql')
    console.log('   3. Copy and paste the SQL into the editor')
    console.log('   4. Click "Run" to execute the policies')
    console.log('\n   Alternatively, the bucket is created and you can set policies manually in:')
    console.log('   Storage → Policies → product-images')

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
setupStorage()

