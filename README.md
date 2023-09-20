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
  - tests (later)
- start eclair as a subprocess (https://nodejs.org/api/child_process.html)
  - start `eclair lsp` (continuously running eclair process)
  - send JSON to eclair
  - receive JSON from eclair
- implement following handlers:
  - initializedHandler (setup)
  - workspaceChangeConfigurationHandler (setup)
  - cancelationHandler (setup)
  - hoverHandler (to get type information)
  - documentHighlightHandler (to see usage of variables in a block of eclair
    code)
  - didOpenTextDocumentNotificationHandler (diagnostics: errors)
  - didChangeTextDocumentNotificationHandler (diagnostics)
  - didSaveTextDocumentNotificationHandler (diagnostics)
- add tests (with dummy "eclair" process that can send back any JSON)
