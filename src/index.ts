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
import { spawn } from "child_process";
import { createInterface } from "readline";

const delay = (delayMs: number) =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

type ProcessCallbacks = {
  onLine: (line: string) => void;
  onClose: (code: number | null) => void;
  onError: (err: Error) => void;
};

const runSubProcess = (
  command: string,
  { onLine, onClose, onError }: ProcessCallbacks
) => {
  const [cmd, ...args] = command.split(" ");

  const program = spawn(cmd, args, { stdio: "pipe" });
  const itf = createInterface(program.stdout);

  const write = (data: string) => {
    program.stdin.write(data + "\n");
  };

  const shutdown = () => {
    // First tear down interface linked to stdout, then rest of the process
    itf.close();
    program.kill();
  };

  program.stdout.setEncoding("utf8");

  itf.on("line", onLine);

  program.on("close", (code) => {
    itf.close();
    onClose(code);
  });

  program.on("error", (err) => {
    itf.close();
    program.kill();
    onError(err);
  });

  return { write, shutdown };
};

const main = async () => {
  const { write, shutdown } = runSubProcess("node echo.js", {
    onLine: (line) => console.log("line", line),
    onClose: (code) => console.log("echo.js exited with code:", code),
    onError: (err) => {
      console.error("echo.js failed with error:");
      console.error(err);
    },
  });

  write("works?");
  write("works?");
  write("works?");
  write("works?");
  write("works?");
  write("works?");

  await delay(1000);
  shutdown();
  // console.log("hello eclair lsp");
  // const connection = createConnection(ProposedFeatures.all);
  // connection.onHover(TODO)
};

main();
