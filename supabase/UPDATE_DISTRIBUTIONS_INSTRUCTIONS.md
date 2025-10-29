# Update Distributions Table Schema

This migration fixes the distributions table schema to match the application's requirements.

## What This Migration Does

1. Renames `response_template_ids` to `automation_template_ids` (if it exists)
2. Changes the column type from `UUID[]` to `JSONB` for better structure
3. Updates indexes to match the new column names
4. Adds helpful comments to the columns

**Note**: `link_text` is NOT added to distributions - it belongs on the questionnaires table only.

## Files to Apply (in order)

1. `update_distributions_schema.sql` - Updates the distributions table schema
2. `update_distribution_function.sql` - Updates the RLS function

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy the contents of `update_distributions_schema.sql`
5. Paste into the SQL editor and click **Run**
6. Repeat for `update_distribution_function.sql`
7. Verify the output shows the updated schema

### Option 2: Supabase CLI

```bash
# Make sure you're in the project root
cd /home/hoogi

# Apply the migrations in order
supabase db execute -f supabase/update_distributions_schema.sql
supabase db execute -f supabase/update_distribution_function.sql
```

### Option 3: Using psql

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration files in order
\i supabase/update_distributions_schema.sql
\i supabase/update_distribution_function.sql
```

## Code Changes Made

The following code changes have been made to the Angular application:

- **questionnaires.component.ts:184** - Changed `response_template_ids` to `automation_template_ids`
- **Removed incorrect migration** - Deleted `migrations/add_link_text_to_distributions.sql` (link_text belongs on questionnaires, not distributions)

## Verification

After running the migrations, verify the schema:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'distributions'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (UUID)
- `questionnaire_id` (UUID)
- `automation_template_ids` (JSONB)
- `token` (TEXT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

**Note**: `link_text` should NOT be in this list - it belongs on the questionnaires table.

## Notes

- These migrations are **idempotent** - they can be run multiple times safely
- Uses `IF EXISTS` and `IF NOT EXISTS` checks to prevent errors
- Existing data will be preserved during column renaming
- The migration will automatically convert existing UUID arrays to JSONB format
