#!/usr/bin/env node

/**
 * React Native Version Compatibility Checker
 * Ensures all React Native related packages are compatible with the main RN version
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const { dependencies, devDependencies } = packageJson;

// Get React Native version
const rnVersion = dependencies['react-native'];
const majorMinorVersion = rnVersion.replace(/[^0-9.]/g, '').split('.').slice(0, 2).join('.');

console.log(`🔍 Checking compatibility for React Native ${rnVersion}`);
console.log(`📦 Target major.minor version: ${majorMinorVersion}`);

// Check React Native related packages (Expo compatible)
const rnPackages = [
  '@react-native/eslint-config', 
  '@react-native/typescript-config'
];

let hasIncompatibleVersions = false;

console.log('\n📋 React Native Package Versions:');
rnPackages.forEach(pkg => {
  const version = devDependencies[pkg];
  if (version) {
    const cleanVersion = version.replace(/[^0-9.]/g, '');
    const pkgMajorMinor = cleanVersion.split('.').slice(0, 2).join('.');
    
    const isCompatible = pkgMajorMinor === majorMinorVersion;
    const status = isCompatible ? '✅' : '❌';
    
    console.log(`${status} ${pkg}: ${version} ${!isCompatible ? `(should be ~${majorMinorVersion}.x)` : ''}`);
    
    if (!isCompatible) {
      hasIncompatibleVersions = true;
    }
  } else {
    console.log(`❌ ${pkg}: NOT INSTALLED`);
    hasIncompatibleVersions = true;
  }
});

// Check other important versions
console.log('\n📋 Other Important Versions:');
const otherPackages = {
  'react': dependencies.react,
  'expo': dependencies.expo,
  'typescript': devDependencies.typescript
};

Object.entries(otherPackages).forEach(([pkg, version]) => {
  if (version) {
    console.log(`📦 ${pkg}: ${version}`);
  } else {
    console.log(`❌ ${pkg}: NOT INSTALLED`);
  }
});

if (hasIncompatibleVersions) {
  console.log('\n⚠️  VERSION MISMATCHES DETECTED!');
  console.log('\n🔧 To fix, run:');
  console.log(`yarn add -D ${rnPackages.map(pkg => `${pkg}@^${majorMinorVersion}.0`).join(' ')}`);
  process.exit(1);
} else {
  console.log('\n✅ All React Native packages are compatible!');
  process.exit(0);
} 