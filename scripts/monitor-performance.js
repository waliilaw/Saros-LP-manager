const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

const THRESHOLD = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  pwa: 80,
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  return runnerResult;
}

async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    scores: results.lhr.categories,
    metrics: {
      'First Contentful Paint': results.lhr.audits['first-contentful-paint'].numericValue,
      'Time to Interactive': results.lhr.audits['interactive'].numericValue,
      'Speed Index': results.lhr.audits['speed-index'].numericValue,
      'Total Blocking Time': results.lhr.audits['total-blocking-time'].numericValue,
      'Largest Contentful Paint': results.lhr.audits['largest-contentful-paint'].numericValue,
      'Cumulative Layout Shift': results.lhr.audits['cumulative-layout-shift'].numericValue,
    },
    failures: [],
  };

  // Check for scores below threshold
  Object.entries(results.lhr.categories).forEach(([category, data]) => {
    if (data.score * 100 < THRESHOLD[category]) {
      report.failures.push({
        category,
        score: data.score * 100,
        threshold: THRESHOLD[category],
        message: `${category} score (${Math.round(data.score * 100)}) is below threshold (${
          THRESHOLD[category]
        })`,
      });
    }
  });

  return report;
}

async function saveReport(report) {
  const reportsDir = path.join(process.cwd(), 'performance-reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const filename = `report-${report.timestamp.split('T')[0]}.json`;
  await fs.writeFile(
    path.join(reportsDir, filename),
    JSON.stringify(report, null, 2)
  );
}

async function main() {
  try {
    console.log('🔍 Running performance audit...');
    
    const url = process.env.DEPLOY_URL || 'http://localhost:3000';
    const results = await runLighthouse(url);
    const report = await generateReport(results);
    
    await saveReport(report);

    console.log('\n📊 Performance Report:');
    console.log('----------------------');
    Object.entries(report.scores).forEach(([category, data]) => {
      console.log(`${category}: ${Math.round(data.score * 100)}/100`);
    });

    if (report.failures.length > 0) {
      console.log('\n⚠️ Performance Issues:');
      console.log('--------------------');
      report.failures.forEach(failure => {
        console.log(`- ${failure.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ All performance metrics meet thresholds!');
    }
  } catch (error) {
    console.error('❌ Error running performance audit:', error);
    process.exit(1);
  }
}

main();
