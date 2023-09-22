import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  TextDocumentSyncKind,
  DocumentHighlightParams,
  Location,
  HoverParams,
  Hover,
  TextDocumentChangeEvent,
  IConnection,
  ResponseError,
  ErrorCodes,
  DocumentHighlight,
  DocumentHighlightKind,
  DidChangeTextDocumentParams,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import eclairLsp, { EclairLsp } from "./eclair-lsp";
import assert from "assert";

const setupVFS = (conn: IConnection, eclair: EclairLsp) => {
  const vfs = new TextDocuments(TextDocument);
  const updateVFS = async (event: TextDocumentChangeEvent<TextDocument>) => {
    // TODO add debouncing if handler becomes too slow?
    const file = event.document.uri;
    const contents = event.document.getText();
    const msg = { file, contents };
    const response = await eclair.updateVFS(msg);
    assert(response.success);
  };
  vfs.onDidOpen(updateVFS);
  vfs.onDidChangeContent(updateVFS);
  vfs.listen(conn);
};

const setupHover = (conn: IConnection, eclair: EclairLsp) =>
  conn.onHover(async (params: HoverParams): Promise<Hover | ResponseError> => {
    const file = params.textDocument.uri;
    const { line, character: column } = params.position;
    const msg = {
      file,
      position: { line, column },
    };
    const response = await eclair.hover(msg);
    if (response.type === "error") {
      return new ResponseError(
        ErrorCodes.InvalidParams,
        response.error.message
      );
    }

    const { start, end } = response.hover.location;
    return {
      contents: response.hover.type,
      range: {
        start: { line: start.line, character: start.column },
        end: { line: end.line, character: end.column },
      },
    };
  });

const setupDocumentHighlight = (conn: IConnection, eclair: EclairLsp) =>
  conn.onDocumentHighlight(
    async (
      params: DocumentHighlightParams
    ): Promise<DocumentHighlight[] | ResponseError> => {
      const file = params.textDocument.uri;
      const { line, character: column } = params.position;
      const msg = {
        file,
        position: { line, column },
      };
      const response = await eclair.documentHighlight(msg);
      if (response.type === "error") {
        return new ResponseError(
          ErrorCodes.InternalError,
          response.error.message
        );
      }
      return response["document-highlight"].map((highlight) => {
        const { start, end } = highlight;
        return {
          range: {
            start: { line: start.line, character: start.column },
            end: { line: end.line, character: end.column },
          },
          kind: DocumentHighlightKind.Read,
        };
      });
    }
  );

const setupDiagnostics = (conn: IConnection, eclair: EclairLsp) =>
  conn.onDidChangeTextDocument(
    async (
      params: DidChangeTextDocumentParams
    ): Promise<void | ResponseError> => {
      const file = params.textDocument.uri;
      const response = await eclair.diagnostics({ file });
      if (response.type === "error") {
        // TODO does this work? or do we also send a single error diagnostic here?
        return new ResponseError(
          ErrorCodes.InternalError,
          response.error.message
        );
      }

      const diagnostics: Diagnostic[] = response.diagnostics.map((d) => {
        const { start, end } = d.location;
        return {
          message: d.message,
          range: {
            start: { line: start.line, character: start.column },
            end: { line: end.line, character: end.column },
          },
          severity:
            d.severity === "error"
              ? DiagnosticSeverity.Error
              : DiagnosticSeverity.Information,
          source: d.source,
        };
      });
      conn.sendDiagnostics({ uri: file, diagnostics });
    }
  );

const setupHandlers = (conn: IConnection, eclair: EclairLsp) => {
  setupVFS(conn, eclair);
  setupHover(conn, eclair);
  setupDocumentHighlight(conn, eclair);
  setupDiagnostics(conn, eclair);
};

const setupInitialization = (conn: IConnection) =>
  conn.onInitialize((_params: InitializeParams) => ({
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      completionProvider: {
        resolveProvider: false,
      },
    },
  }));

const setupLsp = () => {
  const eclair = eclairLsp();
  const conn = createConnection();
  setupHandlers(conn, eclair);
  setupInitialization(conn);

  return conn;
};

// TODO tests
const main = async () => {
  const serverConnection = setupLsp();
  serverConnection.listen();
};

main();
