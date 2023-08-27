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

const main = () => {
  console.log("hello eclair lsp");
  const connection = createConnection(ProposedFeatures.all);
  // connection.onHover(TODO)
};

main();
