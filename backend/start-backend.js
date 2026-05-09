const { spawn } = require('child_process');
const fs = require('fs');

console.log("Starting Backend server in background...");

const out = fs.openSync('./backend-out.log', 'w');
const err = fs.openSync('./backend-err.log', 'w');

const child = spawn('npx.cmd', ['ts-node', 'src/index.ts'], {
  detached: true,
  stdio: [ 'ignore', out, err ],
  shell: true
});

child.unref();

console.log("Backend server detached. Check backend-out.log for status.");
