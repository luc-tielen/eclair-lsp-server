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
  // console.log("hello eclair lsp");
  // const connection = createConnection(ProposedFeatures.all);
  // connection.onHover(TODO)
};

main();
