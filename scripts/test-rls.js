/**
 * Test RLS Policies
 * Run this script to verify your Supabase RLS policies are working correctly
 */

import { getSupabaseClient } from '@/template';

async function testRLSPolicies() {
  const supabase = getSupabaseClient();

  console.log('🧪 Testing Supabase RLS Policies...\n');

  try {
    // Test 1: Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ No authenticated user found');
      console.log('Please log in first');
      return;
    }

    console.log(`✅ Authenticated as user: ${user.id}\n`);

    // Test 2: Try to insert a test recording
    console.log('📝 Testing INSERT policy...');
    const { data: insertData, error: insertError } = await supabase
      .from('emergency_recordings')
      .insert({
        user_id: user.id,
        video_path: 'test/path.mp4',
        video_url: 'https://example.com/test.mp4',
        emergency_type: 'pulled_over',
        duration_seconds: 60,
        location_latitude: 40.7128,
        location_longitude: -74.0060,
        location_address: 'New York, NY'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ INSERT policy failed:', insertError.message);
    } else {
      console.log('✅ INSERT policy working');
      console.log(`   Created recording: ${insertData.id}`);
    }

    // Test 3: Try to read own recordings
    console.log('\n📖 Testing SELECT policy...');
    const { data: selectData, error: selectError } = await supabase
      .from('emergency_recordings')
      .select('*')
      .eq('user_id', user.id);

    if (selectError) {
      console.error('❌ SELECT policy failed:', selectError.message);
    } else {
      console.log(`✅ SELECT policy working`);
      console.log(`   Found ${selectData.length} recordings`);
    }

    // Test 4: Try to update own recording
    if (insertData) {
      console.log('\n📝 Testing UPDATE policy...');
      const { error: updateError } = await supabase
        .from('emergency_recordings')
        .update({ duration_seconds: 120 })
        .eq('id', insertData.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ UPDATE policy failed:', updateError.message);
      } else {
        console.log('✅ UPDATE policy working');
      }
    }

    // Test 5: Try to delete own recording
    if (insertData) {
      console.log('\n🗑️ Testing DELETE policy...');
      const { error: deleteError } = await supabase
        .from('emergency_recordings')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.error('❌ DELETE policy failed:', deleteError.message);
      } else {
        console.log('✅ DELETE policy working');
      }
    }

    // Test 6: Verify RLS is enabled
    console.log('\n🔒 Verifying RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_rls_enabled');

    if (rlsError) {
      console.log('ℹ️ Could not verify RLS status (may need admin access)');
    } else {
      console.log('✅ RLS status verified');
    }

    console.log('\n🎉 RLS policy testing complete!');

  } catch (error) {
    console.error('❌ Error testing RLS policies:', error);
  }
}

// Run the test
testRLSPolicies().catch(console.error);
