import axios from 'axios';

// Utility function to seed maintenance requests for poles under maintenance
export const seedMaintenanceRequests = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No access token found. Please log in first.');
      console.error('No access token found. Please log in first.');
      return;
    }

    console.log('🔍 Fetching poles under maintenance...');

    // Get all poles with UNDER_MAINTENANCE status
    const polesResponse = await axios.get('http://localhost:3011/api/v1/poles?status=UNDER_MAINTENANCE&limit=1000', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const polesUnderMaintenance = Array.isArray(polesResponse.data) ? polesResponse.data : polesResponse.data.items || [];
    console.log(`📊 Found ${polesUnderMaintenance.length} poles under maintenance`);

    if (polesUnderMaintenance.length === 0) {
      alert('✅ No poles under maintenance found.');
      console.log('✅ No poles under maintenance found.');
      return;
    }

    console.log('🔍 Fetching existing maintenance schedules...');

    // Get all existing maintenance schedules
    const schedulesResponse = await axios.get('http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const existingSchedules = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : schedulesResponse.data.items || [];
    console.log(`📊 Found ${existingSchedules.length} existing maintenance schedules`);

    // Create a set of pole codes that already have maintenance schedules
    const polesWithSchedules = new Set(existingSchedules.map((schedule: any) => schedule.poleCode));
    console.log(`📊 ${polesWithSchedules.size} poles already have maintenance schedules`);

    // Find poles that need maintenance schedules
    const polesNeedingSchedules = polesUnderMaintenance.filter((pole: any) => !polesWithSchedules.has(pole.code));
    console.log(`🎯 Found ${polesNeedingSchedules.length} poles that need maintenance schedules`);

    if (polesNeedingSchedules.length === 0) {
      alert('✅ All poles under maintenance already have maintenance schedules.');
      console.log('✅ All poles under maintenance already have maintenance schedules.');
      return;
    }

    // Confirm before proceeding
    const confirmMessage = `Found ${polesNeedingSchedules.length} poles that need maintenance schedules.\n\nThis will create maintenance records for these poles. Continue?`;
    if (!confirm(confirmMessage)) {
      console.log('❌ Seeding cancelled by user.');
      return;
    }

    // Create maintenance schedules for poles that don't have them
    console.log('🔧 Creating maintenance schedules...');
    const createdSchedules = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < polesNeedingSchedules.length; i++) {
      const pole = polesNeedingSchedules[i];

      try {
        const scheduleData = {
          poleCode: pole.code,
          description: `Maintenance for pole ${pole.code} at ${pole.street}, ${pole.subcity}`,
          frequency: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: null, // Ongoing maintenance
          status: 'STARTED', // Since they're under maintenance
          estimatedCost: Math.floor(Math.random() * 500) + 100, // Random cost between 100-600
          remark: `Auto-generated maintenance schedule for pole under maintenance`,
        };

        const response = await axios.post('http://localhost:3011/api/v1/maintenance/schedules', scheduleData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        createdSchedules.push(response.data);
        successCount++;

        // Show progress every 10 items
        if ((i + 1) % 10 === 0 || i === polesNeedingSchedules.length - 1) {
          console.log(`✅ Created ${successCount}/${polesNeedingSchedules.length} maintenance schedules (${Math.round((i + 1) / polesNeedingSchedules.length * 100)}%)`);
        }

        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to create maintenance schedule for pole ${pole.code}:`, error.response?.data || error.message);
      }
    }

    const summaryMessage = `🎉 Seeding completed!\n\n📋 Summary:\n   • Poles under maintenance: ${polesUnderMaintenance.length}\n   • Existing schedules: ${existingSchedules.length}\n   • New schedules created: ${successCount}\n   • Failed: ${errorCount}\n   • Total schedules now: ${existingSchedules.length + successCount}`;

    alert(summaryMessage);
    console.log(summaryMessage);

  } catch (error: any) {
    const errorMessage = `❌ Error seeding maintenance requests: ${error.response?.data?.message || error.message}`;
    alert(errorMessage);
    console.error(errorMessage);
  }
};

// Debug function to check current state
export const checkMaintenanceStatus = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('❌ No access token found. Please log in first.');
      return;
    }

    console.log('🔍 Checking current maintenance status...');

    // Get all poles with UNDER_MAINTENANCE status
    const polesResponse = await axios.get('http://localhost:3011/api/v1/poles?status=UNDER_MAINTENANCE&limit=1000', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const polesUnderMaintenance = Array.isArray(polesResponse.data) ? polesResponse.data : polesResponse.data.items || [];
    console.log(`📊 Poles with UNDER_MAINTENANCE status: ${polesUnderMaintenance.length}`);

    if (polesUnderMaintenance.length > 0) {
      console.log('🔍 Sample poles under maintenance:', polesUnderMaintenance.slice(0, 5).map((p: any) => `${p.code} (${p.street}, ${p.subcity})`));
    }

    // Get all maintenance schedules
    const schedulesResponse = await axios.get('http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const existingSchedules = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : schedulesResponse.data.items || [];
    console.log(`📊 Total maintenance schedules: ${existingSchedules.length}`);

    // Check how many schedules are not completed
    const inProgressSchedules = existingSchedules.filter((schedule: any) => schedule.status !== 'COMPLETED');
    console.log(`📊 In-progress maintenance schedules: ${inProgressSchedules.length}`);

    // Find poles that have maintenance schedules
    const polesWithSchedules = new Set(existingSchedules.map((schedule: any) => schedule.poleCode));
    console.log(`📊 Poles with maintenance schedules: ${polesWithSchedules.size}`);

    // Find poles that need schedules
    const polesNeedingSchedules = polesUnderMaintenance.filter((pole: any) => !polesWithSchedules.has(pole.code));
    console.log(`🎯 Poles needing maintenance schedules: ${polesNeedingSchedules.length}`);

    if (polesNeedingSchedules.length > 0) {
      console.log('🔍 Poles that need schedules:', polesNeedingSchedules.map((p: any) => p.code));
    }

    return {
      polesUnderMaintenance: polesUnderMaintenance.length,
      totalSchedules: existingSchedules.length,
      inProgressSchedules: inProgressSchedules.length,
      polesWithSchedules: polesWithSchedules.size,
      polesNeedingSchedules: polesNeedingSchedules.length
    };

  } catch (error: any) {
    console.error('❌ Error checking maintenance status:', error.response?.data || error.message);
  }
};

// Function to run the seeding process
export const runSeeding = () => {
  console.log('🚀 Starting maintenance request seeding process...');
  seedMaintenanceRequests().then(() => {
    console.log('🏁 Seeding process completed!');
  });
};

// Direct API seeding function (bypasses frontend limitations)
export const seedMaintenanceDirect = async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No access token found. Please log in first.');
      return;
    }

    console.log('🔍 Fetching poles under maintenance...');

    // Get all poles with UNDER_MAINTENANCE status
    const polesResponse = await axios.get('http://localhost:3011/api/v1/poles?status=UNDER_MAINTENANCE&limit=1000', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const polesUnderMaintenance = Array.isArray(polesResponse.data) ? polesResponse.data : polesResponse.data.items || [];
    console.log(`📊 Found ${polesUnderMaintenance.length} poles under maintenance`);

    if (polesUnderMaintenance.length === 0) {
      alert('✅ No poles under maintenance found.');
      return;
    }

    console.log('🔍 Fetching existing maintenance schedules...');

    // Get all existing maintenance schedules
    const schedulesResponse = await axios.get('http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const existingSchedules = Array.isArray(schedulesResponse.data) ? schedulesResponse.data : schedulesResponse.data.items || [];
    console.log(`📊 Found ${existingSchedules.length} existing maintenance schedules`);

    // Create a set of pole codes that already have maintenance schedules
    const polesWithSchedules = new Set(existingSchedules.map((schedule: any) => schedule.poleCode));
    console.log(`📊 ${polesWithSchedules.size} poles already have maintenance schedules`);

    // Find poles that need maintenance schedules
    const polesNeedingSchedules = polesUnderMaintenance.filter((pole: any) => !polesWithSchedules.has(pole.code));
    console.log(`🎯 Found ${polesNeedingSchedules.length} poles that need maintenance schedules`);

    if (polesNeedingSchedules.length === 0) {
      alert('✅ All poles under maintenance already have maintenance schedules.');
      return;
    }

    // Confirm before proceeding
    const confirmMessage = `Found ${polesNeedingSchedules.length} poles that need maintenance schedules.\n\nThis will create maintenance records for these poles. Continue?`;
    if (!confirm(confirmMessage)) {
      console.log('❌ Seeding cancelled by user.');
      return;
    }

    // Create maintenance schedules for poles that don't have them
    console.log('🔧 Creating maintenance schedules...');
    const createdSchedules = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < polesNeedingSchedules.length; i++) {
      const pole = polesNeedingSchedules[i];

      try {
        const scheduleData = {
          poleCode: pole.code,
          description: `Maintenance for pole ${pole.code} at ${pole.street}, ${pole.subcity}`,
          frequency: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0], // Today's date
          endDate: null, // Ongoing maintenance
          status: 'STARTED', // Since they're under maintenance
          estimatedCost: Math.floor(Math.random() * 500) + 100, // Random cost between 100-600
          remark: `Auto-generated maintenance schedule for pole under maintenance`,
        };

        const response = await axios.post('http://localhost:3011/api/v1/maintenance/schedules', scheduleData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        createdSchedules.push(response.data);
        successCount++;

        // Show progress every 5 items
        if ((i + 1) % 5 === 0 || i === polesNeedingSchedules.length - 1) {
          console.log(`✅ Created ${successCount}/${polesNeedingSchedules.length} maintenance schedules (${Math.round((i + 1) / polesNeedingSchedules.length * 100)}%)`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to create maintenance schedule for pole ${pole.code}:`, error.response?.data || error.message);
      }
    }

    const summaryMessage = `🎉 Seeding completed!\n\n📋 Summary:\n   • Poles under maintenance: ${polesUnderMaintenance.length}\n   • Existing schedules: ${existingSchedules.length}\n   • New schedules created: ${successCount}\n   • Failed: ${errorCount}\n   • Total schedules now: ${existingSchedules.length + successCount}`;

    alert(summaryMessage);
    console.log(summaryMessage);

    // Refresh the page to show updated data
    setTimeout(() => window.location.reload(), 1000);

  } catch (error: any) {
    const errorMessage = `❌ Error seeding maintenance requests: ${error.response?.data?.message || error.message}`;
    alert(errorMessage);
    console.error(errorMessage);
  }
};

// Make it available globally for browser console use
if (typeof window !== 'undefined') {
  (window as any).seedMaintenanceRequests = runSeeding;
  (window as any).checkMaintenanceStatus = checkMaintenanceStatus;
  (window as any).seedMaintenanceDirect = seedMaintenanceDirect;
  console.log('💡 Maintenance functions available!');
  console.log('   • Run: seedMaintenanceDirect() to seed maintenance schedules directly via API');
  console.log('   • Run: checkMaintenanceStatus() to check current status');
}
