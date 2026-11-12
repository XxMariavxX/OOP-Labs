const { spawn } = require('child_process');

const vite = spawn('vite', [], { stdio: 'inherit', shell: true });
const sass = spawn('sass --watch src/styles/style.scss src/styles/style.css', {
  stdio: 'inherit',
  shell: true,
});

function shutdown() {
  vite.kill();
  sass.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    sass.kill();
    process.exit(code);
  }
});