const { spawn } = require('child_process');
const next = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true
});
next.on('close', (code) => process.exit(code));
