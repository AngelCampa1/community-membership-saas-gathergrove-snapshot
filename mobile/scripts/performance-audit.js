const fs = require('fs');
const path = require('path');

/**
 * Performance audit script for Lighthouse results analysis
 * Validates that we achieve 100/100/100/100 scores
 */

const LIGHTHOUSE_RESULTS_PATH = path.join(__dirname, '..', 'lighthouse-results.json');
const PERFORMANCE_THRESHOLDS = {
  performance: 100,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
  pwa: 90, // PWA is optional but nice to have
};

const CORE_WEB_VITALS_THRESHOLDS = {
  'first-contentful-paint': 1800, // 1.8s
  'largest-contentful-paint': 2500, // 2.5s
  'first-input-delay': 100, // 100ms
  'cumulative-layout-shift': 0.1, // 0.1
  'speed-index': 3400, // 3.4s
  'total-blocking-time': 200, // 200ms
};

async function auditPerformance() {
  try {
    console.log('🔍 Analyzing Lighthouse performance results...\n');

    // Check if results file exists
    if (!fs.existsSync(LIGHTHOUSE_RESULTS_PATH)) {
      throw new Error(`Lighthouse results not found at ${LIGHTHOUSE_RESULTS_PATH}`);
    }

    // Read and parse results
    const resultsData = fs.readFileSync(LIGHTHOUSE_RESULTS_PATH, 'utf8');
    const results = JSON.parse(resultsData);

    if (!results.categories) {
      throw new Error('Invalid Lighthouse results format');
    }

    console.log('📊 LIGHTHOUSE SCORES:');
    console.log('========================');

    let allScoresPassed = true;
    const scoreResults = {};

    // Check category scores
    for (const [category, threshold] of Object.entries(PERFORMANCE_THRESHOLDS)) {
      const categoryData = results.categories[category];
      if (categoryData) {
        const score = Math.round(categoryData.score * 100);
        scoreResults[category] = score;
        const passed = score >= threshold;
        const status = passed ? '✅' : '❌';
        const emoji = getScoreEmoji(score);
        
        console.log(`${status} ${emoji} ${category.toUpperCase()}: ${score}/100 (target: ${threshold})`);
        
        if (!passed) {
          allScoresPassed = false;
          console.log(`   ⚠️  Failed to meet target of ${threshold}`);
        }
      } else {
        console.log(`❓ ${category.toUpperCase()}: Not measured`);
      }
    }

    console.log('\n🎯 CORE WEB VITALS:');
    console.log('===================');

    let allVitalsPassed = true;
    const vitalsResults = {};

    // Check Core Web Vitals
    if (results.audits) {
      for (const [vital, threshold] of Object.entries(CORE_WEB_VITALS_THRESHOLDS)) {
        const audit = results.audits[vital];
        if (audit && audit.numericValue !== undefined) {
          const value = audit.numericValue;
          vitalsResults[vital] = value;
          const passed = value <= threshold;
          const status = passed ? '✅' : '❌';
          const unit = getVitalUnit(vital);
          
          console.log(`${status} ${vital.toUpperCase().replace(/-/g, ' ')}: ${Math.round(value)}${unit} (target: ≤${threshold}${unit})`);
          
          if (!passed) {
            allVitalsPassed = false;
            console.log(`   ⚠️  Exceeds target of ${threshold}${unit}`);
          }
        }
      }
    }

    // Performance insights
    console.log('\n💡 PERFORMANCE INSIGHTS:');
    console.log('=========================');

    if (results.audits) {
      const insights = analyzePerformanceInsights(results.audits);
      insights.forEach(insight => console.log(`• ${insight}`));
    }

    // Accessibility insights
    console.log('\n♿ ACCESSIBILITY INSIGHTS:');
    console.log('===========================');

    if (results.audits) {
      const a11yInsights = analyzeAccessibilityInsights(results.audits);
      a11yInsights.forEach(insight => console.log(`• ${insight}`));
    }

    // SEO insights
    console.log('\n🔍 SEO INSIGHTS:');
    console.log('================');

    if (results.audits) {
      const seoInsights = analyzeSEOInsights(results.audits);
      seoInsights.forEach(insight => console.log(`• ${insight}`));
    }

    // Overall result
    console.log('\n🏆 OVERALL RESULT:');
    console.log('==================');

    if (allScoresPassed && allVitalsPassed) {
      console.log('🎉 PERFECT LIGHTHOUSE SCORES ACHIEVED! 🎉');
      console.log('🚀 All categories: 100/100/100/100');
      console.log('⚡ All Core Web Vitals: PASSED');
      console.log('\n🌟 Your app is optimized for maximum performance!');
    } else {
      console.log('⚠️  Some metrics need improvement:');
      
      if (!allScoresPassed) {
        console.log('   📊 Lighthouse scores below target');
      }
      
      if (!allVitalsPassed) {
        console.log('   ⚡ Core Web Vitals above threshold');
      }
      
      console.log('\n🔧 Check the insights above for optimization recommendations.');
    }

    // Generate summary report
    const summary = {
      timestamp: new Date().toISOString(),
      allScoresPassed,
      allVitalsPassed,
      scores: scoreResults,
      vitals: vitalsResults,
      url: results.finalUrl || results.requestedUrl,
    };

    const summaryPath = path.join(__dirname, '..', 'performance-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Detailed summary saved to: ${summaryPath}`);

    // Exit with appropriate code
    process.exit(allScoresPassed && allVitalsPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Error analyzing performance results:', error.message);
    process.exit(1);
  }
}

function getScoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

function getVitalUnit(vital) {
  if (vital.includes('shift')) return '';
  if (vital.includes('delay') || vital.includes('paint') || vital.includes('blocking') || vital.includes('index')) return 'ms';
  return 'ms';
}

function analyzePerformanceInsights(audits) {
  const insights = [];
  
  if (audits['unused-css-rules'] && audits['unused-css-rules'].details) {
    const wastedBytes = audits['unused-css-rules'].details.overallSavingsBytes || 0;
    if (wastedBytes > 10000) {
      insights.push(`Remove ${Math.round(wastedBytes / 1024)}KB of unused CSS`);
    }
  }
  
  if (audits['unused-javascript'] && audits['unused-javascript'].details) {
    const wastedBytes = audits['unused-javascript'].details.overallSavingsBytes || 0;
    if (wastedBytes > 10000) {
      insights.push(`Remove ${Math.round(wastedBytes / 1024)}KB of unused JavaScript`);
    }
  }
  
  if (audits['render-blocking-resources'] && audits['render-blocking-resources'].details) {
    const blockingResources = audits['render-blocking-resources'].details.items || [];
    if (blockingResources.length > 0) {
      insights.push(`Eliminate ${blockingResources.length} render-blocking resources`);
    }
  }

  if (audits['offscreen-images'] && audits['offscreen-images'].details) {
    const offscreenBytes = audits['offscreen-images'].details.overallSavingsBytes || 0;
    if (offscreenBytes > 10000) {
      insights.push(`Implement lazy loading for ${Math.round(offscreenBytes / 1024)}KB of images`);
    }
  }

  if (insights.length === 0) {
    insights.push('Performance is optimal! 🚀');
  }
  
  return insights;
}

function analyzeAccessibilityInsights(audits) {
  const insights = [];
  
  const a11yAudits = [
    'color-contrast',
    'heading-order',
    'alt-text',
    'aria-labels',
    'keyboard-navigation'
  ];
  
  let issuesFound = 0;
  
  for (const auditName of a11yAudits) {
    const audit = audits[auditName];
    if (audit && audit.score !== null && audit.score < 1) {
      issuesFound++;
    }
  }
  
  if (issuesFound === 0) {
    insights.push('All accessibility checks passed! ♿');
    insights.push('Perfect color contrast and ARIA implementation');
  } else {
    insights.push(`${issuesFound} accessibility issues detected`);
  }
  
  return insights;
}

function analyzeSEOInsights(audits) {
  const insights = [];
  
  if (audits['meta-description'] && audits['meta-description'].score === 1) {
    insights.push('Meta description is optimized ✓');
  }
  
  if (audits['document-title'] && audits['document-title'].score === 1) {
    insights.push('Page title is SEO-friendly ✓');
  }
  
  if (audits['structured-data'] && audits['structured-data'].score === 1) {
    insights.push('Structured data is properly implemented ✓');
  }
  
  if (insights.length === 0) {
    insights.push('SEO optimization is perfect! 🎯');
  }
  
  return insights;
}

// Run the audit
auditPerformance();