const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
try {
  if (!fs.existsSync('.env')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('Created .env from .env.example');
  }
  const check = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    throw new Error('Docker недоступен. Установите и запустите Docker Desktop / Docker Engine, затем повторите npm run dev.');
  }
  execFileSync('docker', ['compose', 'up', '-d', '--wait', 'db'], { stdio: 'inherit' });
  if (!process.env.npm_execpath) throw new Error('Запустите подготовку командой npm run setup.');
  execFileSync(process.execPath, [process.env.npm_execpath, 'run', 'migration:run'], { stdio: 'inherit' });
  console.log('База готова. Запуск приложения: npm run start:dev. Swagger: путь /api.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
