const fs = require('fs');

try {
  const data = fs.readFileSync('e2e-results-utf8-2.json', 'utf8');
  const report = JSON.parse(data);

  console.log(`Total Tests: ${report.stats.total}`);
  console.log(`Expected: ${report.stats.expected}`);
  console.log(`Unexpected: ${report.stats.unexpected}`);
  console.log(`Flaky: ${report.stats.flaky}`);
  console.log('\n--- Failures ---\n');

  report.suites.forEach(suite => {
    processSuite(suite);
  });

  function processSuite(suite) {
    if (suite.specs) {
      suite.specs.forEach(spec => {
        if (spec.tests) {
          spec.tests.forEach(test => {
            if (test.status === 'unexpected' || test.status === 'flaky') {
               console.log(`File: ${spec.file}`);
               console.log(`Test: ${spec.title}`);
               if (test.results) {
                 test.results.forEach(result => {
                   if (result.error) {
                     console.log(`Error: ${result.error.message}`);
                     // console.log(`Stack: ${result.error.stack}`); // Optional: too verbose
                   }
                 });
               }
               console.log('--------------------------------------------------');
            }
          });
        }
      });
    }
    if (suite.suites) {
      suite.suites.forEach(childSuite => {
        processSuite(childSuite);
      });
    }
  }

} catch (err) {
  console.error('Error parsing JSON:', err);
}
