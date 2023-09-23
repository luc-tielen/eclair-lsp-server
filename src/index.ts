#!/usr/bin/env node

import setupLsp from "./lsp-server.js";

const main = async () => {
  const { conn: serverConnection, eclair } = setupLsp();
  serverConnection.listen();
  serverConnection.onExit(async () => {
    eclair.shutdown();
    // await eclair;
  });
};

main();
