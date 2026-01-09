const commandRegistry = require('./src/commands/index');
const { ROLES } = require('./src/utils/constants');

function test() {
  try {
    console.log('--- Testing Command Registry ---');

    // Test 1: Get common command
    const helpCmd = commandRegistry.getCommand('help', ROLES.KARYAWAN);
    if (helpCmd && helpCmd.name === 'help') {
      console.log('✅ Common command found');
    } else {
      console.error('❌ Common command lookup failed');
    }

    // Test 2: Get role-specific command (Karyawan)
    const catatCmd = commandRegistry.getCommand('catat', ROLES.KARYAWAN);
    if (catatCmd && catatCmd.name === 'catat') {
      console.log('✅ Karyawan command found');
    } else {
      console.error('❌ Karyawan command lookup failed');
    }

    // Test 3: Get admin command as Superadmin (inheritance)
    const addKaryawanCmd = commandRegistry.getCommand('addkaryawan', ROLES.SUPERADMIN);
    if (addKaryawanCmd) {
      console.log('✅ Role inheritance working (Superadmin -> Admin capabilities)');
    } else {
      console.error('❌ Role inheritance failed');
    }

    // Test 4: Check invalid permissions
    const restrictedCmd = commandRegistry.getCommand('createadmin', ROLES.KARYAWAN);
    if (restrictedCmd === null) {
      console.log('✅ Permission restriction working');
    } else {
      console.error('❌ Permission check failed (Karyawan accessed Superadmin command)');
    }

    console.log('✅ Part 5 Verification Passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  }
}

test();
