"use strict";

jest.autoMockOff();

const defineTest = require("jscodeshift/dist/testUtils").defineTest;

defineTest(__dirname, "use-arrow-function-for-service-export");
