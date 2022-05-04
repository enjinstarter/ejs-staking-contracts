const shell = require("shelljs");

shell.config.fatal = true;

// https://github.com/crytic/solc-select#usage
shell.exec("solc --version");

// Ensure analyze all contracts
shell.exec("npm run clean");

// https://github.com/crytic/slither#detectors
// Excluded false warning for the following detectors:
//    - missing-inheritance: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-inheritance
//    - solc-version: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity
//    - unimplemented-functions: https://github.com/crytic/slither/wiki/Detector-Documentation#unimplemented-functions
shell.exec(`
  slither \
      --exclude timestamp,missing-inheritance,solc-version,unimplemented-functions \
      .
`);
