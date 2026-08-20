#!/usr/bin/env node

/**
 * Staging Package Builder for GatherGrove Frontend
 * 
 * This script creates a clean package.json for the standalone Next.js build
 * by filtering out problematic dependencies and including only staging requirements.
 * 
 * This permanently fixes the "client": "file:" dependency issue that causes
 * container crashes in Azure App Service deployments.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Building staging package.json...');

try {
  // Read the source package.json
  const sourcePackagePath = path.join(__dirname, '..', 'package.json');
  const sourcePkg = JSON.parse(fs.readFileSync(sourcePackagePath, 'utf8'));
  
  console.log(`📦 Source package: ${sourcePkg.name}@${sourcePkg.version}`);
  
  // Create staging package.json with only essential fields
  const stagingPkg = {
    name: sourcePkg.name,
    version: sourcePkg.version,
    private: sourcePkg.private,
    license: sourcePkg.license,
    engines: sourcePkg.engines,
    scripts: {
      start: 'node server.js'
    },
    dependencies: {}
  };
  
  // Filter and include only valid staging dependencies
  if (sourcePkg.dependencies) {
    Object.entries(sourcePkg.dependencies).forEach(([name, version]) => {
      // Skip any file: dependencies that cause deployment issues
      if (version.startsWith('file:')) {
        console.log(`❌ Excluding problematic dependency: ${name}: ${version}`);
        return;
      }
      
      // Include valid dependencies
      stagingPkg.dependencies[name] = version;
    });
  }
  
  console.log(`✅ Staging dependencies: ${Object.keys(stagingPkg.dependencies).length}`);
  
  // Write to standalone build directory
  const standalonePath = path.join(__dirname, '..', '.next', 'standalone');
  const outputPath = path.join(standalonePath, 'package.json');
  
  // Ensure standalone directory exists
  if (!fs.existsSync(standalonePath)) {
    console.error('❌ Standalone build directory not found. Run "yarn build:staging" first.');
    process.exit(1);
  }
  
  // Write the clean package.json
  fs.writeFileSync(outputPath, JSON.stringify(stagingPkg, null, 2));
  console.log(`✅ Clean package.json written to: ${outputPath}`);
  
  // Validation
  const writtenPkg = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  const fileRefs = Object.values(writtenPkg.dependencies || {}).filter(v => v.startsWith('file:'));
  
  if (fileRefs.length > 0) {
    console.error(`❌ Validation failed: Found ${fileRefs.length} file: references`);
    process.exit(1);
  }
  
  console.log('✅ Validation passed: No problematic dependencies found');
  console.log('🚀 Staging package.json ready for deployment');
  
} catch (error) {
  console.error('❌ Error building staging package:', error.message);
  process.exit(1);
}