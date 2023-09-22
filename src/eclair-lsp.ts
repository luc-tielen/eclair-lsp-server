import runSubProcess from "./subprocess.js";

// 0-based
type Position = {
  line: number;
  column: number;
};

type SourceSpan = {
  file: string;
  start: Position;
  end: Position;
};

type Type = "u32" | "string";

type Severity = "error";

type DiagnosticSource =
  | "Parser"
  | "Typesystem"
  | "SemanticAnalysis"
  | "Transpiler";

type Command<T extends string, C> = {
  type: T;
  command: C;
};

type UpdateVFSCommand = Command<
  "update-vfs",
  { file: string; contents: string }
>;

type HoverCommand = Command<"hover", { file: string; position: Position }>;

type HoverResponse = {
  location: SourceSpan;
  type: Type;
};

type ErrorResponse = {
  file: string;
  position: Position;
  error: string;
};

type DocumentHighlightCommand = Command<
  "document-highlight",
  { file: string; position: Position }
>;

type DocumentHighlightResponse = SourceSpan[];

type DiagnosticsCommand = Command<"diagnostics", { file: string }>;

type DiagnosticInfo = {
  location: SourceSpan;
  source: DiagnosticSource;
  severity: Severity;
  message: string;
};

type DiagnosticsResponse = DiagnosticInfo[];

type SuccessResponse = {
  success: true;
};

const eclairLsp = () => {
  // TODO env vars (temporarily)
  const eclair = runSubProcess("eclair lsp");

  const write = async <T>(msg: object) => {
    const response = await eclair.write(JSON.stringify(msg));
    return JSON.parse(response as string) as T;
  };

  const shutdown = async () => {
    await write({ type: "shutdown" });
    eclair.shutdown();
  };

  const updateVFS = (msg: UpdateVFSCommand) => write<SuccessResponse>(msg);
  const hover = (msg: HoverCommand) =>
    write<HoverResponse | ErrorResponse>(msg);
  const documentHighlight = (msg: DocumentHighlightCommand) =>
    write<DocumentHighlightResponse | ErrorResponse>(msg);
  const diagnostics = (msg: DiagnosticsCommand) =>
    write<DiagnosticsResponse | ErrorResponse>(msg);

  return {
    then: eclair.then,
    shutdown,
    updateVFS,
    hover,
    documentHighlight,
    diagnostics,
  };
};

export default eclairLsp;
