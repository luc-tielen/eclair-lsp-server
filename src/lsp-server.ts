import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  TextDocumentSyncKind,
  DocumentHighlightParams,
  HoverParams,
  Hover,
  TextDocumentChangeEvent,
  Connection,
  ResponseError,
  ErrorCodes,
  DocumentHighlight,
  DocumentHighlightKind,
  DidChangeTextDocumentNotification,
  HoverRequest,
  DocumentDiagnosticRequest,
  WorkspaceDiagnosticRequest,
  DocumentHighlightRequest,
  DidOpenTextDocumentNotification,
  PositionEncodingKind,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import eclairLsp, { EclairLsp } from "./eclair-lsp.js";
import assert from "assert";

const setupVFS = (eclair: EclairLsp) => {
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
  vfs.onDidSave(updateVFS);
  vfs.onDidChangeContent(updateVFS);
  return vfs;
};

const setupHover = (conn: Connection, eclair: EclairLsp) =>
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

const setupDocumentHighlight = (conn: Connection, eclair: EclairLsp) =>
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
      return response.highlights.map((highlight) => {
        const { start, end } = highlight;
        return {
          range: {
            start: { line: start.line, character: start.column },
            end: { line: end.line, character: end.column },
          },
          kind: DocumentHighlightKind.Text,
        };
      });
    }
  );

type DiagnosticParams = {
  textDocument: { uri: string };
};

const setupDiagnostics = (conn: Connection, eclair: EclairLsp) => {
  const publishDiagnostics = async (
    params: DiagnosticParams
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
  };

  conn.onDidOpenTextDocument(publishDiagnostics);
  conn.onDidChangeTextDocument(publishDiagnostics);
  conn.onDidSaveTextDocument(publishDiagnostics);
};

const setupHandlers = (conn: Connection, eclair: EclairLsp) => {
  const vfs = setupVFS(eclair);
  setupHover(conn, eclair);
  setupDocumentHighlight(conn, eclair);
  setupDiagnostics(conn, eclair);
  return vfs;
};

const setupInitialization = (conn: Connection) => {
  conn.onInitialize((_params: InitializeParams) => ({
    capabilities: {
      positionEncoding: PositionEncodingKind.UTF8,
      workspace: {
        // do we need this?
        workspaceFolders: {
          changeNotifications: true,
          supported: true,
        },
      },
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Full,
      },
      hoverProvider: true,
      documentHighlightProvider: true,
      referencesProvider: true,
      diagnosticProvider: {
        identifier: "eclair",
        interFileDependencies: true,
        workspaceDiagnostics: true,
      },
      // TODO implement these at some later time
      typeDefinitionProvider: false,
      definitionProvider: false,
      completionProvider: {
        resolveProvider: false,
      },
      documentFormattingProvider: false,
      codeActionProvider: false,
    },
  }));
  conn.onInitialized(() => {
    conn.client.register(DidOpenTextDocumentNotification.type);
    conn.client.register(DidChangeTextDocumentNotification.type);
    conn.client.register(HoverRequest.type);
    conn.client.register(DocumentHighlightRequest.type);
    conn.client.register(DocumentDiagnosticRequest.type);
    conn.client.register(WorkspaceDiagnosticRequest.type);
  });
};

const setupLsp = () => {
  const eclair = eclairLsp();
  const conn: Connection = (createConnection as any)(); // vscode types suck.
  const vfs = setupHandlers(conn, eclair);
  setupInitialization(conn);

  vfs.listen(conn);
  return { eclair, conn };
};

export default setupLsp;
