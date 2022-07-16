const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@mathix420/introspector",
    roots: ["<rootDir>/packages/introspector/src/", "<rootDir>/packages/introspector/tests/"],
    coverageDirectory: "<rootDir>/packages/introspector/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/introspector/tsconfig.json",
        },
    },
};
