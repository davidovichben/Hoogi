#!/usr/bin/env node

/**
 * Setup Supabase Storage Buckets
 *
 * This script creates the necessary storage buckets for the application.
 * Run this script once to set up storage buckets in your Supabase project.
 *
 * Usage: node setup_storage_bucket.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBuckets() {
  console.log('🚀 Setting up Supabase storage buckets...\n');

  const buckets = [
    {
      name: 'uploads',
      options: {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      }
    }
  ];

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error(`❌ Error listing buckets:`, listError.message);
        continue;
      }

      const bucketExists = existingBuckets?.some(b => b.name === bucket.name);

      if (bucketExists) {
        console.log(`✅ Bucket '${bucket.name}' already exists`);

        // Update bucket settings
        const { error: updateError } = await supabase.storage.updateBucket(
          bucket.name,
          bucket.options
        );

        if (updateError) {
          console.warn(`⚠️  Could not update bucket '${bucket.name}':`, updateError.message);
        } else {
          console.log(`   Updated bucket settings`);
        }
      } else {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(
          bucket.name,
          bucket.options
        );

        if (createError) {
          console.error(`❌ Error creating bucket '${bucket.name}':`, createError.message);
        } else {
          console.log(`✅ Created bucket '${bucket.name}'`);
        }
      }

      // Set up folder structure with a placeholder file
      const folders = ['logos', 'questionnaire-attachments'];
      for (const folder of folders) {
        const { error: uploadError } = await supabase.storage
          .from(bucket.name)
          .upload(`${folder}/.keep`, new Blob([''], { type: 'text/plain' }), {
            upsert: true,
            cacheControl: '3600'
          });

        if (!uploadError) {
          console.log(`   Created folder: ${folder}/`);
        }
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Unexpected error with bucket '${bucket.name}':`, error);
    }
  }

  console.log('✅ Storage bucket setup complete!\n');
}

setupStorageBuckets().catch(console.error);
