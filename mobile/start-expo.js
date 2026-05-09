const { spawn } = require('child_process');
const fs = require('fs');

console.log("Starting Expo server in background...");

const out = fs.openSync('./expo-out.log', 'w');
const err = fs.openSync('./expo-err.log', 'w');

const child = spawn('npx.cmd', ['expo', 'start', '--tunnel'], {
  detached: true,
  stdio: [ 'ignore', out, err ],
  shell: true
});

child.unref();

console.log("Expo server detached. Check expo-out.log for the connection URL.");
