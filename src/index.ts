#!/usr/bin/env node

import setupLsp from "./lsp-server.js";

const main = () => {
  const serverConnection = setupLsp();
  serverConnection.listen();
};

main();
