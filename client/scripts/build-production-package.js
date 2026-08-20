#!/usr/bin/env node

/**
 * Production Package Builder for GatherGrove Frontend
 * 
 * This script creates a clean package.json for the standalone Next.js build
 * by filtering out problematic dependencies and including only production requirements.
 * 
 * This permanently fixes the "client": "file:" dependency issue that causes
 * container crashes in Azure App Service deployments.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Building production package.json...');

try {
  // Read the source package.json
  const sourcePackagePath = path.join(__dirname, '..', 'package.json');
  const sourcePkg = JSON.parse(fs.readFileSync(sourcePackagePath, 'utf8'));
  
  console.log(`📦 Source package: ${sourcePkg.name}@${sourcePkg.version}`);
  
  // Create production package.json with only essential fields
  const prodPkg = {
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
  
  // Filter and include only valid production dependencies
  if (sourcePkg.dependencies) {
    Object.entries(sourcePkg.dependencies).forEach(([name, version]) => {
      // Skip any file: dependencies that cause deployment issues
      if (version.startsWith('file:')) {
        console.log(`❌ Excluding problematic dependency: ${name}: ${version}`);
        return;
      }
      
      // Include valid dependencies
      prodPkg.dependencies[name] = version;
    });
  }
  
  console.log(`✅ Production dependencies: ${Object.keys(prodPkg.dependencies).length}`);
  
  // Write to standalone build directory
  const standalonePath = path.join(__dirname, '..', '.next', 'standalone');
  const outputPath = path.join(standalonePath, 'package.json');
  
  // Ensure standalone directory exists
  if (!fs.existsSync(standalonePath)) {
    console.error('❌ Standalone build directory not found. Run "yarn build" first.');
    console.error(`   Expected path: ${standalonePath}`);
    console.error('   Make sure you have run the build process and standalone output is enabled.');
    process.exit(1);
  }
  
  // Write the clean package.json
  try {
    fs.writeFileSync(outputPath, JSON.stringify(prodPkg, null, 2));
    console.log(`✅ Clean package.json written to: ${outputPath}`);
  } catch (writeError) {
    console.error(`❌ Failed to write package.json to ${outputPath}:`, writeError.message);
    process.exit(1);
  }
  
  // Validation
  try {
    const writtenPkg = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const fileRefs = Object.values(writtenPkg.dependencies || {}).filter(v => v.startsWith('file:'));
    
    if (fileRefs.length > 0) {
      console.error(`❌ Validation failed: Found ${fileRefs.length} file: references:`);
      fileRefs.forEach(ref => console.error(`   - ${ref}`));
      process.exit(1);
    }
    
    console.log(`✅ Dependencies validated: ${Object.keys(writtenPkg.dependencies || {}).length} clean dependencies`);
  } catch (validationError) {
    console.error('❌ Validation failed: Could not read written package.json:', validationError.message);
    process.exit(1);
  }
  
  console.log('✅ Validation passed: No problematic dependencies found');
  console.log('🚀 Production package.json ready for deployment');
  
} catch (error) {
  console.error('❌ Error building production package:', error.message);
  process.exit(1);
}