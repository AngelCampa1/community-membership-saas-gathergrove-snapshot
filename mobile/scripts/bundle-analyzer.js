/**
 * Bundle Analyzer Configuration
 * Provides build size analysis and optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const BUNDLE_SIZE_LIMITS = {
  warning: 500 * 1024, // 500KB warning threshold
  error: 1024 * 1024,  // 1MB error threshold
};

const ASSET_SIZE_LIMITS = {
  js: 250 * 1024,      // 250KB for JS files
  css: 50 * 1024,      // 50KB for CSS files
  image: 100 * 1024,   // 100KB for images
};

/**
 * Analyze bundle sizes from Metro output
 */
function analyzeBundles() {
  try {
    console.log(chalk.blue('\n🔍 Bundle Analysis Report\n'));
    
    // Look for Metro output files
    const buildDir = path.join(__dirname, '../build');
    const webBuildDir = path.join(__dirname, '../web-build');
    
    let totalSize = 0;
    const warnings = [];
    const errors = [];

    // Check if build directories exist
    const dirsToCheck = [buildDir, webBuildDir].filter(dir => fs.existsSync(dir));
    
    if (dirsToCheck.length === 0) {
      console.log(chalk.yellow('⚠️  No build directories found. Run a build first.'));
      return;
    }

    // Analyze each build directory
    dirsToCheck.forEach(dir => {
      console.log(chalk.green(`📁 Analyzing: ${path.basename(dir)}`));
      
      const files = getFilesRecursively(dir);
      const analysis = analyzeFiles(files, dir);
      
      totalSize += analysis.totalSize;
      warnings.push(...analysis.warnings);
      errors.push(...analysis.errors);
      
      displayAnalysis(analysis, path.basename(dir));
    });

    // Display summary
    displaySummary(totalSize, warnings, errors);
    
    // Generate recommendations
    generateRecommendations(warnings, errors);
    
    return {
      totalSize,
      warnings: warnings.length,
      errors: errors.length,
      success: errors.length === 0,
    };

  } catch (error) {
    console.error(chalk.red('❌ Bundle analysis failed:'), error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all files recursively from a directory
 */
function getFilesRecursively(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...getFilesRecursively(fullPath));
      } else {
        const stats = fs.statSync(fullPath);
        files.push({
          path: fullPath,
          name: item.name,
          size: stats.size,
          extension: path.extname(item.name).toLowerCase(),
        });
      }
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Could not read directory: ${dir}`));
  }
  
  return files;
}

/**
 * Analyze files and categorize issues
 */
function analyzeFiles(files, baseDir) {
  let totalSize = 0;
  const warnings = [];
  const errors = [];
  const categorizedSizes = {
    js: 0,
    css: 0,
    images: 0,
    fonts: 0,
    other: 0,
  };

  files.forEach(file => {
    totalSize += file.size;
    
    // Categorize by extension
    const category = categorizeFile(file.extension);
    categorizedSizes[category] += file.size;
    
    // Check individual file size limits
    const limit = getFileSizeLimit(file.extension);
    if (limit && file.size > limit) {
      const issue = {
        type: 'oversized-file',
        file: path.relative(baseDir, file.path),
        size: file.size,
        limit,
        category,
      };
      
      if (file.size > limit * 2) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
    
    // Check for common issues
    checkCommonIssues(file, baseDir, warnings, errors);
  });

  // Check total bundle size
  if (totalSize > BUNDLE_SIZE_LIMITS.error) {
    errors.push({
      type: 'total-size-error',
      size: totalSize,
      limit: BUNDLE_SIZE_LIMITS.error,
    });
  } else if (totalSize > BUNDLE_SIZE_LIMITS.warning) {
    warnings.push({
      type: 'total-size-warning',
      size: totalSize,
      limit: BUNDLE_SIZE_LIMITS.warning,
    });
  }

  return {
    totalSize,
    categorizedSizes,
    warnings,
    errors,
    fileCount: files.length,
  };
}

/**
 * Categorize file by extension
 */
function categorizeFile(extension) {
  const categories = {
    js: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    css: ['.css', '.scss', '.sass', '.less'],
    images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
    fonts: ['.woff', '.woff2', '.ttf', '.eot', '.otf'],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(extension)) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Get size limit for file type
 */
function getFileSizeLimit(extension) {
  const category = categorizeFile(extension);
  return ASSET_SIZE_LIMITS[category];
}

/**
 * Check for common optimization issues
 */
function checkCommonIssues(file, baseDir, warnings) {
  const relativePath = path.relative(baseDir, file.path);
  
  // Check for unminified files in production
  if (file.name.includes('.min.') === false && file.extension === '.js' && file.size > 50 * 1024) {
    warnings.push({
      type: 'unminified-js',
      file: relativePath,
      size: file.size,
    });
  }
  
  // Check for source maps in production
  if (file.extension === '.map') {
    warnings.push({
      type: 'source-map',
      file: relativePath,
      size: file.size,
    });
  }
  
  // Check for duplicate files
  if (file.name.includes('duplicate') || file.name.includes('copy')) {
    warnings.push({
      type: 'potential-duplicate',
      file: relativePath,
      size: file.size,
    });
  }
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis, buildType) {
  console.log(chalk.cyan(`\n📊 ${buildType} Analysis:`));
  console.log(`   Total size: ${formatSize(analysis.totalSize)}`);
  console.log(`   Files: ${analysis.fileCount}`);
  
  console.log(chalk.cyan('\n📋 Size by Category:'));
  Object.entries(analysis.categorizedSizes).forEach(([category, size]) => {
    if (size > 0) {
      const percentage = ((size / analysis.totalSize) * 100).toFixed(1);
      console.log(`   ${category.toUpperCase()}: ${formatSize(size)} (${percentage}%)`);
    }
  });
}

/**
 * Display summary
 */
function displaySummary(totalSize, warnings, errors) {
  console.log(chalk.blue('\n🎯 Summary:'));
  console.log(`   Total bundle size: ${formatSize(totalSize)}`);
  console.log(`   Warnings: ${chalk.yellow(warnings.length)}`);
  console.log(`   Errors: ${chalk.red(errors.length)}`);
  
  if (errors.length > 0) {
    console.log(chalk.red('\n❌ Critical Issues:'));
    errors.forEach(error => displayIssue(error, 'error'));
  }
  
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Warnings:'));
    warnings.forEach(warning => displayIssue(warning, 'warning'));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green('\n✅ No issues found! Bundle is well optimized.'));
  }
}

/**
 * Display individual issue
 */
function displayIssue(issue, type) {
  const color = type === 'error' ? chalk.red : chalk.yellow;
  const icon = type === 'error' ? '❌' : '⚠️';
  
  switch (issue.type) {
    case 'oversized-file':
      console.log(color(`   ${icon} ${issue.file}: ${formatSize(issue.size)} (limit: ${formatSize(issue.limit)})`));
      break;
    case 'total-size-error':
    case 'total-size-warning':
      console.log(color(`   ${icon} Bundle too large: ${formatSize(issue.size)} (limit: ${formatSize(issue.limit)})`));
      break;
    case 'unminified-js':
      console.log(color(`   ${icon} Unminified JS: ${issue.file} (${formatSize(issue.size)})`));
      break;
    case 'source-map':
      console.log(color(`   ${icon} Source map in production: ${issue.file}`));
      break;
    case 'potential-duplicate':
      console.log(color(`   ${icon} Potential duplicate: ${issue.file}`));
      break;
    default:
      console.log(color(`   ${icon} ${issue.type}: ${issue.file || 'Unknown'}`));
  }
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(warnings, errors) {
  if (warnings.length === 0 && errors.length === 0) {
    return;
  }
  
  console.log(chalk.blue('\n💡 Optimization Recommendations:\n'));
  
  const recommendations = new Set();
  
  [...warnings, ...errors].forEach(issue => {
    switch (issue.type) {
      case 'oversized-file':
        if (issue.category === 'js') {
          recommendations.add('• Consider code splitting for large JavaScript files');
          recommendations.add('• Enable tree shaking to remove unused code');
          recommendations.add('• Use dynamic imports for non-critical code');
        } else if (issue.category === 'images') {
          recommendations.add('• Optimize images using tools like imagemin');
          recommendations.add('• Consider using WebP format for images');
          recommendations.add('• Implement lazy loading for images');
        }
        break;
      case 'total-size-error':
      case 'total-size-warning':
        recommendations.add('• Split your bundle into smaller chunks');
        recommendations.add('• Remove unused dependencies');
        recommendations.add('• Enable gzip compression on your server');
        break;
      case 'unminified-js':
        recommendations.add('• Enable minification in your build process');
        break;
      case 'source-map':
        recommendations.add('• Remove source maps from production builds');
        break;
      case 'potential-duplicate':
        recommendations.add('• Remove duplicate files from your build');
        break;
    }
  });
  
  recommendations.forEach(rec => console.log(chalk.cyan(rec)));
}

/**
 * Format file size in human readable format
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Run analysis if called directly
if (require.main === module) {
  const result = analyzeBundles();
  process.exit(result?.success ? 0 : 1);
}

module.exports = { analyzeBundles, formatSize };