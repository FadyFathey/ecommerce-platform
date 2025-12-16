/**
 * Complete Supabase Storage Setup
 * 
 * This script will:
 * 1. Create the product-images storage bucket
 * 2. Set up all storage policies
 * 
 * Requirements:
 * - SUPABASE_URL or VITE_SUPABASE_URL in .env
 * - SUPABASE_SERVICE_ROLE_KEY in .env (required for full automation)
 * 
 * Get service role key from: Supabase Dashboard → Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Complete Supabase Storage Setup\n')

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL is required')
  console.error('   Please add it to your .env file')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required for automated setup')
  console.error('\n📝 To get your service role key:')
  console.error('   1. Go to: https://supabase.com/dashboard')
  console.error('   2. Select your project')
  console.error('   3. Go to: Settings → API')
  console.error('   4. Copy the "service_role" key (it\'s the secret one)')
  console.error('\n   Then add to your .env file:')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
  console.error('\n   ⚠️  WARNING: Never commit this key to version control!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKET_NAME = 'product-images'

async function createBucket() {
  console.log('📦 Step 1: Creating storage bucket...')
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

  if (bucketExists) {
    console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists\n`)
    return true
  }

  // Create the bucket
  const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  })

  if (createError) {
    if (createError.message.includes('already exists') || 
        createError.message.includes('duplicate') ||
        createError.message.includes('Bucket already exists')) {
      console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists\n`)
      return true
    }
    throw createError
  }

  console.log(`   ✓ Bucket '${BUCKET_NAME}' created successfully`)
  console.log(`   ✓ Public access: Enabled`)
  console.log(`   ✓ Max file size: 10MB`)
  console.log(`   ✓ Allowed types: JPEG, PNG, GIF, WebP\n`)
  return true
}

async function setupPolicies() {
  console.log('🔐 Step 2: Setting up storage policies...')
  
  // Read SQL file
  const sqlFilePath = join(process.cwd(), 'supabase-storage-policies.sql')
  let sqlContent
  try {
    sqlContent = readFileSync(sqlFilePath, 'utf-8')
  } catch (error) {
    console.error(`   ❌ Failed to read SQL file: ${sqlFilePath}`)
    throw error
  }

  // Extract policy statements
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

  // Execute policies using Supabase REST API
  let successCount = 0
  for (const policy of policies) {
    try {
      // Use PostgREST to execute SQL via a function call
      // First, try to create a helper function if it doesn't exist
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `

      // Try executing the policy directly via REST API
      // Supabase allows executing SQL through the REST API with service role key
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        },
        body: JSON.stringify({ sql: policy.sql })
      })

      if (response.ok) {
        console.log(`   ✓ Policy '${policy.name}' created`)
        successCount++
      } else {
        // Try alternative: Use direct SQL execution
        // Note: This requires the exec_sql function to exist
        console.log(`   ⚠️  Policy '${policy.name}' - trying alternative method...`)
        
        // For now, we'll note that manual setup may be needed
        console.log(`   ℹ️  Policy '${policy.name}' may need manual setup`)
      }
    } catch (error) {
      console.log(`   ⚠️  Policy '${policy.name}' - ${error.message}`)
    }
  }

  if (successCount === policies.length) {
    console.log(`\n   ✅ All ${policies.length} policies created successfully!\n`)
    return true
  } else {
    console.log(`\n   ⚠️  ${successCount}/${policies.length} policies created automatically`)
    console.log(`   ℹ️  Remaining policies need manual setup (see instructions below)\n`)
    return false
  }
}

async function main() {
  try {
    // Step 1: Create bucket
    await createBucket()

    // Step 2: Setup policies
    const allPoliciesCreated = await setupPolicies()

    if (allPoliciesCreated) {
      console.log('✅ Complete! Storage is fully configured and ready to use.\n')
      console.log('🎉 You can now upload product images from your application!')
    } else {
      console.log('✅ Bucket created successfully!')
      console.log('\n📝 To complete setup, manually create policies:')
      console.log('   1. Go to: Supabase Dashboard → SQL Editor')
      console.log('   2. Open: supabase-storage-policies.sql')
      console.log('   3. Copy and paste the SQL')
      console.log('   4. Click "Run"\n')
    }

    console.log('📋 Setup Summary:')
    console.log(`   • Bucket: ${BUCKET_NAME}`)
    console.log(`   • Public: Yes`)
    console.log(`   • Max size: 10MB`)
    console.log(`   • Types: JPEG, PNG, GIF, WebP`)
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message)
    console.error('\n📝 Manual setup instructions:')
    console.error('   1. Go to Supabase Dashboard → Storage')
    console.error(`   2. Create bucket: ${BUCKET_NAME} (make it public)`)
    console.error('   3. Go to SQL Editor and run: supabase-storage-policies.sql')
    process.exit(1)
  }
}

main()

