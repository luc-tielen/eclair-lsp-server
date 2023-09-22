# Eclair LSP server

Language server written in Typescript (running on nodejs) for LSP integration of
Eclair.

## Dev setup

- Install [Eclair](https://github.com/luc-tielen/eclair-lang) and make sure it
  is available in your `$PATH`
- Install nvm
- Run the following commands:

  ```bash
  nvm use 18
  npm install
  npm run build
  npm start
  ```

## Running the tests

Use `npm run test` to run the testsuite.

## TODO

- CI
  - linting
  - prettier-check
  - build
  - tests
    - test eclair as a subprocess
    - test lsp handlers (how?)
      - add tests (with dummy "eclair" process that can send back any JSON we need)?
- implement following handlers:
  - initializedHandler (setup)
  - workspaceChangeConfigurationHandler (setup)
  - cancelationHandler (setup)
