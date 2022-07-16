const globalConf = require("../../jest.config.base");

module.exports = {
    ...globalConf,
    displayName: "@mathix420/graphql-ogm",
    roots: ["<rootDir>/packages/ogm/src", "<rootDir>/packages/ogm/tests"],
    coverageDirectory: "<rootDir>/packages/ogm/coverage/",
    globals: {
        "ts-jest": {
            tsconfig: "<rootDir>/packages/ogm/tsconfig.json",
        },
    },
};
