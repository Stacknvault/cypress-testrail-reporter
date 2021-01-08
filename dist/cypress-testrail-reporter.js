"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CypressTestRailReporter = exports.TestRailSingleton = void 0;
var mocha_1 = require("mocha");
var moment = require("moment");
var testrail_1 = require("./testrail");
var shared_1 = require("./shared");
var testrail_interface_1 = require("./testrail.interface");
var chalk = require('chalk');
var TestRailSingleton = /** @class */ (function () {
    function TestRailSingleton() {
    }
    TestRailSingleton.getTestRail = function (reporterOptions) {
        if (!TestRailSingleton.testRail) {
            TestRailSingleton.testRail = new testrail_1.TestRail(reporterOptions);
            var executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
            var name_1 = (reporterOptions.runName || 'NEW Automated test run') + " " + executionDateTime;
            var description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
            console.log('Creating the testrail instance with the testrun id', reporterOptions.runId);
            TestRailSingleton.testRail.runId = reporterOptions.runId;
            // TestRailSingleton.testRail.createRun(name, description);
        }
        return TestRailSingleton.testRail;
    };
    TestRailSingleton.results = [];
    return TestRailSingleton;
}());
exports.TestRailSingleton = TestRailSingleton;
var CypressTestRailReporter = /** @class */ (function (_super) {
    __extends(CypressTestRailReporter, _super);
    // private results: TestRailResult[] = [];
    // private testRail: TestRail;
    function CypressTestRailReporter(runner, options) {
        var _this = _super.call(this, runner) || this;
        console.log("xxxxxx", options);
        var reporterOptions = options.reporterOptions;
        if (process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD) {
            reporterOptions.password = process.env.CYPRESS_TESTRAIL_REPORTER_PASSWORD;
        }
        // testRail = new TestRail(reporterOptions);
        _this.validate(reporterOptions, 'host');
        _this.validate(reporterOptions, 'username');
        _this.validate(reporterOptions, 'password');
        _this.validate(reporterOptions, 'projectId');
        _this.validate(reporterOptions, 'suiteId');
        var testRail = TestRailSingleton.getTestRail(reporterOptions);
        runner.on('start', function () {
            console.log('start');
            // const executionDateTime = moment().format('MMM Do YYYY, HH:mm (Z)');
            // const name = `${reporterOptions.runName || 'Automated test run'} ${executionDateTime}`;
            // const description = 'For the Cypress run visit https://dashboard.cypress.io/#/projects/runs';
            // testRail.createRun(name, description);
        });
        runner.on('pass', function (test) {
            var _a;
            console.log('pass');
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                var results = caseIds.map(function (caseId) {
                    return {
                        case_id: caseId,
                        status_id: testrail_interface_1.Status.Passed,
                        comment: "Execution time: " + test.duration + "ms",
                        elapsed: test.duration / 1000 + "s"
                    };
                });
                (_a = TestRailSingleton.results).push.apply(_a, results);
            }
        });
        runner.on('fail', function (test) {
            var _a;
            console.log('fail');
            var caseIds = shared_1.titleToCaseIds(test.title);
            if (caseIds.length > 0) {
                var results = caseIds.map(function (caseId) {
                    return {
                        case_id: caseId,
                        status_id: testrail_interface_1.Status.Failed,
                        comment: "" + test.err.message,
                    };
                });
                (_a = TestRailSingleton.results).push.apply(_a, results);
            }
        });
        runner.on('end', function () {
            // publish test cases results & close the run
            testRail.publishResults(TestRailSingleton.results)
                .then(function () {
                console.log('Results published');
                TestRailSingleton.results = [];
            })
                .catch(console.error);
        });
        return _this;
    }
    CypressTestRailReporter.prototype.validate = function (options, name) {
        if (options == null) {
            throw new Error('Missing reporterOptions in cypress.json');
        }
        if (options[name] == null) {
            throw new Error("Missing " + name + " value. Please update reporterOptions in cypress.json");
        }
    };
    return CypressTestRailReporter;
}(mocha_1.reporters.Spec));
exports.CypressTestRailReporter = CypressTestRailReporter;
//# sourceMappingURL=cypress-testrail-reporter.js.map