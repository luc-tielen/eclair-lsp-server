import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node.js";
import runSubProcess from "./subprocess.js";

// TODO
// how to set up this code as LSP server?
// start Eclair LSP subprocess
// setting up env (temporarily)
const main = async () => {
  try {
    const echo = runSubProcess("node echo.js");

    const line = await echo.write("test 123?");
    console.log(line);
    const line2 = await echo.write("works?");
    console.log(line2);

    echo.shutdown();

    const code = await echo;
    console.log("echo.js exited with code:", code);
  } catch (err) {
    console.error("echo.js failed with error:");
    console.error(err);
  }

  // console.log("hello eclair lsp");
  // const connection = createConnection(ProposedFeatures.all);
  // connection.onHover(TODO)
};

main();
