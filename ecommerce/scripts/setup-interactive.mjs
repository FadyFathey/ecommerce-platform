/**
 * Interactive Supabase Storage Setup
 * Prompts for service role key if not found in .env
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createInterface } from 'readline'

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

function saveToEnv(key, value) {
  const envPath = join(process.cwd(), '.env')
  let envContent = ''
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8')
  }
  
  // Check if key already exists
  const lines = envContent.split('\n')
  let found = false
  const newLines = lines.map(line => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true
      return `${key}=${value}`
    }
    return line
  })
  
  if (!found) {
    newLines.push(`${key}=${value}`)
  }
  
  writeFileSync(envPath, newLines.join('\n'))
}

function askQuestion(query) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

loadEnv()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Interactive Supabase Storage Setup\n')

if (!supabaseUrl) {
  console.error('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL is required')
  process.exit(1)
}

if (!supabaseServiceRoleKey) {
  console.log('📝 Service role key not found in .env file')
  console.log('\nTo get your service role key:')
  console.log('   1. Go to: https://supabase.com/dashboard')
  console.log('   2. Select your project')
  console.log('   3. Go to: Settings → API')
  console.log('   4. Copy the "service_role" key (it\'s the secret one)\n')
  
  const answer = await askQuestion('Enter your SUPABASE_SERVICE_ROLE_KEY (or press Enter to skip): ')
  
  if (answer.trim()) {
    supabaseServiceRoleKey = answer.trim()
    saveToEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceRoleKey)
    console.log('✓ Service role key saved to .env file\n')
  } else {
    console.log('\n⚠️  Skipping automated setup. You can set up manually:')
    console.log('   1. Add SUPABASE_SERVICE_ROLE_KEY to .env')
    console.log('   2. Run: npm run setup:complete')
    process.exit(0)
  }
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKET_NAME = 'product-images'

async function createBucket() {
  console.log('📦 Creating storage bucket...')
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)

  if (bucketExists) {
    console.log(`   ✓ Bucket '${BUCKET_NAME}' already exists\n`)
    return true
  }

  const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10485760,
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
  console.log('🔐 Setting up storage policies...')
  
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

  let successCount = 0
  for (const policy of policies) {
    try {
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
        console.log(`   ⚠️  Policy '${policy.name}' - may need manual setup`)
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
    console.log(`   ℹ️  Remaining policies need manual setup\n`)
    return false
  }
}

async function main() {
  try {
    await createBucket()
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

