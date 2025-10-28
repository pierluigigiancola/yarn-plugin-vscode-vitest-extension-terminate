module.exports = {
  name: `plugin-vscode-vitest-extension-terminate`,
  factory: require => ({
    hooks: {
      validateProject() {
        tryTerminateVitestExplorer();
      },
    },
  })
};

// If running on Windows, run a PowerShell command to stop node.exe processes
// whose command line includes "vitest.explorer". We use spawnSync to avoid
// shell quoting pitfalls and to run the exact PowerShell command.
function tryTerminateVitestExplorer() {
  const { spawnSync } = require('child_process');

  if (process.platform !== 'win32') {
    return;
  }

  // Build the PowerShell command. Use -NoProfile and -NonInteractive to
  // keep it quiet. The command filters Win32_Process by Name and CommandLine
  // and passes the ProcessId to Stop-Process.
  const psCommand = `Get-CimInstance -ClassName Win32_Process -Filter "Name = 'node.exe' and CommandLine like '%vitest.explorer%'" | Stop-Process -Id {$_.ProcessId}`;

  // Run powershell.exe with the command as an argument
  const args = ['-NoProfile', '-NonInteractive', '-Command', psCommand];

  const res = spawnSync('powershell.exe', args, { windowsHide: true, stdio: 'inherit' });

  if (res.error) {
    // Don't crash the host; log a warning to the console.
    // Using console.warn keeps this lightweight and safe.
    console.warn('Failed to run PowerShell termination command:', res.error && res.error.message);
  }
}

