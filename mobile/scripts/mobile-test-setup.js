#!/usr/bin/env node

/**
 * Mobile Testing Environment Setup Script
 * 
 * This script sets up and validates the mobile testing environment,
 * including Expo web server, backend API connectivity, and testing tools.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function checkEnvironment() {
  log('🔍 Checking mobile testing environment...', 'cyan');
  
  const checks = [
    {
      name: 'Node.js version',
      command: 'node --version',
      validator: (output) => {
        const version = output.stdout.trim();
        const major = parseInt(version.replace('v', '').split('.')[0]);
        return major >= 18;
      },
    },
    {
      name: 'Expo CLI',
      command: 'npx expo --version',
      validator: (output) => output.stdout.trim().length > 0,
    },
    {
      name: 'React Native dependencies',
      command: 'npm list react-native',
      validator: (output) => !output.error,
    },
  ];
  
  for (const check of checks) {
    try {
      const result = await execAsync(check.command);
      if (check.validator(result)) {
        log(`  ✅ ${check.name}: OK`, 'green');
      } else {
        log(`  ❌ ${check.name}: Failed validation`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${check.name}: ${error.error?.message || 'Check failed'}`, 'red');
    }
  }
}

async function checkBackendAPI() {
  log('🔍 Checking backend API connectivity...', 'cyan');
  
  const backendPort = 5284;
  const isBackendRunning = await checkPort(backendPort);
  
  if (isBackendRunning) {
    log(`  ✅ Backend API (port ${backendPort}): Running`, 'green');
  } else {
    log(`  ⚠️  Backend API (port ${backendPort}): Not running`, 'yellow');
    log('    Start the backend with: cd ../backend && dotnet run', 'yellow');
  }
}

async function setupEnvironmentFile() {
  log('🔍 Checking environment configuration...', 'cyan');
  
  const envFile = path.join(__dirname, '..', '.env');
  const envExampleFile = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExampleFile)) {
      fs.copyFileSync(envExampleFile, envFile);
      log('  ✅ Created .env file from .env.example', 'green');
    } else {
      // Create basic .env file
      const basicEnv = `API_BASE_URL=http://localhost:5284
NODE_ENV=development
EXPO_WEB_URL=http://localhost:8081`;
      fs.writeFileSync(envFile, basicEnv);
      log('  ✅ Created basic .env file', 'green');
    }
  } else {
    log('  ✅ Environment file exists', 'green');
  }
}

async function installPlaywrightBrowsers() {
  log('🔍 Installing Playwright browsers for mobile testing...', 'cyan');
  
  try {
    await execAsync('npx playwright install');
    log('  ✅ Playwright browsers installed', 'green');
  } catch (error) {
    log('  ⚠️  Playwright browser installation failed', 'yellow');
    log('    Run manually: npx playwright install', 'yellow');
  }
}

async function validateTestSetup() {
  log('🔍 Validating test setup...', 'cyan');
  
  const testDirs = ['tests', 'tests/e2e', '__tests__'];
  const configFiles = ['jest.config.js', 'playwright.config.ts'];
  
  for (const dir of testDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      log(`  ✅ Test directory: ${dir}`, 'green');
    } else {
      log(`  ❌ Missing test directory: ${dir}`, 'red');
    }
  }
  
  for (const file of configFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ Config file: ${file}`, 'green');
    } else {
      log(`  ❌ Missing config file: ${file}`, 'red');
    }
  }
}

async function runTestSuite() {
  log('🧪 Running mobile test validation...', 'cyan');
  
  try {
    await execAsync('npm test -- --passWithNoTests --verbose');
    log('  ✅ Jest tests: Passed', 'green');
  } catch (error) {
    log('  ⚠️  Jest tests: Some tests failed or configuration issue', 'yellow');
  }
}

async function displaySummary() {
  log('\n📱 Mobile Testing Environment Setup Complete!', 'blue');
  log('\nAvailable Commands:', 'cyan');
  log('  npm start                  - Start Expo development server');
  log('  npm run web               - Start Expo web server');
  log('  npm test                  - Run Jest unit tests');
  log('  npm run test:coverage     - Run tests with coverage');
  log('  npm run test:e2e          - Run Playwright mobile e2e tests');
  log('  npm run typecheck         - Type checking');
  log('  npm run lint              - Code linting');
  
  log('\nTesting on Physical Devices:', 'cyan');
  log('  1. Update API_BASE_URL in .env to your computer\'s IP address');
  log('  2. Ensure your device and computer are on the same network');
  log('  3. Run: npm start');
  log('  4. Scan QR code with Expo Go app');
  
  log('\nTroubleshooting:', 'cyan');
  log('  - If backend API tests fail, start the backend server first');
  log('  - For Playwright tests, ensure web server is running');
  log('  - Check .env file for correct API URLs');
}

async function main() {
  try {
    log('🚀 Mobile Testing Environment Setup', 'blue');
    log('=====================================', 'blue');
    
    await checkEnvironment();
    await checkBackendAPI();
    await setupEnvironmentFile();
    await installPlaywrightBrowsers();
    await validateTestSetup();
    await runTestSuite();
    await displaySummary();
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironment,
  checkBackendAPI,
  setupEnvironmentFile,
  validateTestSetup,
};