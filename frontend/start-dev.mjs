/**
 * Unified Development Server
 * Runs both Vite (frontend) and Express (backend) in a single process
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Unified Development Server\n');

// Start Express backend on port 3001
console.log('📦 Starting Express backend (port 3001)...');
const backend = spawn('npm', ['run', 'server:api'], {
    cwd: join(__dirname, 'server'),
    shell: true,
    stdio: 'inherit'
});

// Give backend time to start
setTimeout(() => {
    console.log('\n⚡ Starting Vite frontend (port 5173)...');
    console.log('   Frontend will proxy /api requests to backend\n');

    // Start Vite frontend on port 5173
    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: __dirname,
        shell: true,
        stdio: 'inherit'
    });

    // Handle frontend exit
    frontend.on('exit', (code) => {
        console.log('\n⚠️  Frontend exited with code', code);
        backend.kill();
        process.exit(code || 0);
    });

    // Handle backend exit
    backend.on('exit', (code) => {
        console.log('\n⚠️  Backend exited with code', code);
        frontend.kill();
        process.exit(code || 0);
    });

    // Handle CTRL+C
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down servers...');
        backend.kill();
        frontend.kill();
        process.exit(0);
    });

}, 2000);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Servers starting...');
console.log('   Backend:  http://localhost:3001');
console.log('   Frontend: http://localhost:5173');
console.log('   Press Ctrl+C to stop both servers');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
