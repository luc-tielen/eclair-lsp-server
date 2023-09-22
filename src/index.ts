import setupLsp from "./lsp-server";

const main = () => {
  const serverConnection = setupLsp();
  serverConnection.listen();
};

main();
