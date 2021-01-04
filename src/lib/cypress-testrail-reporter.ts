import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailOptions, TestRailResult } from './testrail.interface';
const chalk = require('chalk');
export class TestRailSingleton {
  private static testRail: TestRail;
  public static results: TestRailResult[] = [];
  public static getTestRail(reporterOptions: TestRailOptions){
    if (!TestRailSingleton.testRail){
      TestRailSingleton.testRail = new TestRail(reporterOptions);
      const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
      const name = `${reporterOptions.runName || 'NEW Automated test run'} ${executionDateTime}`;
      const description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
      console.log('Creating the testrail instance with the testrun id', reporterOptions.runId)
      TestRailSingleton.testRail.runId = reporterOptions.runId;
      // TestRailSingleton.testRail.createRun(name, description);
    }
    return TestRailSingleton.testRail;
  }
}
export class CypressTestRailReporter extends reporters.Spec {
  // private results: TestRailResult[] = [];
  // private testRail: TestRail;

  constructor(runner: any, options: any) {
    super(runner);
    let reporterOptions = options.reporterOptions;

    if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
      reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
    }

    // testRail = new TestRail(reporterOptions);
    this.validate(reporterOptions, 'host');
    this.validate(reporterOptions, 'username');
    this.validate(reporterOptions, 'password');
    this.validate(reporterOptions, 'projectId');
    this.validate(reporterOptions, 'suiteId');

    const testRail = TestRailSingleton.getTestRail(reporterOptions);

    runner.on('start', () => {
      console.log('start');
      // const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
      // const name = `${reporterOptions.runName || 'Automated test run'} ${executionDateTime}`;
      // const description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
      // testRail.createRun(name, description);
    });

    runner.on('pass', test => {
      console.log('pass');
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Passed,
            comment: `Execution time: ${test.duration}ms`,
            elapsed: `${test.duration/1000}s`
          };
        });
        TestRailSingleton.results.push(...results);
      }
    });

    runner.on('fail', test => {
      console.log('fail');
      const caseIds = titleToCaseIds(test.title);
      if (caseIds.length > 0) {
        const results = caseIds.map(caseId => {
          return {
            case_id: caseId,
            status_id: Status.Failed,
            comment: `${test.err.message}`,
          };
        });
        TestRailSingleton.results.push(...results);
      }
    });

    runner.on('end', () => {
      // publish test cases results & close the run
      testRail.publishResults(TestRailSingleton.results)
        .then(() => console.log('Results published'))
        .catch(console.error);
    });

  }

  private validate(options, name: string) {
    if (options == null) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    if (options[name] == null) {
      throw new Error(`Missing ${name} value. Please update reporterOptions in cypress.json`);
    }
  }
}