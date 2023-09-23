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

type CommandType =
  | "update-vfs"
  | "hover"
  | "document-highlight"
  | "diagnostics";

type ResultTag = "hover" | "highlights" | "diagnostics";

type Result<K extends ResultTag, A, B> =
  | ({ type: "success" } & { [key in K]: A })
  | { type: "error"; error: B };

type UpdateVFSCommand = {
  file: string;
  contents: string;
};

type HoverCommand = {
  file: string;
  position: Position;
};

type HoverResponse = {
  location: SourceSpan;
  type: Type;
};

type ErrorResponse = {
  file: string;
  position: Position;
  message: string;
};

type DocumentHighlightCommand = {
  file: string;
  position: Position;
};

type DocumentHighlightResponse = SourceSpan[];

type DiagnosticsCommand = {
  file: string;
};

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

type Handler<Command, Response> = (cmd: Command) => Promise<Response>;

export type EclairLsp = {
  updateVFS: Handler<UpdateVFSCommand, SuccessResponse>;
  hover: Handler<HoverCommand, Result<"hover", HoverResponse, ErrorResponse>>;
  documentHighlight: Handler<
    DocumentHighlightCommand,
    Result<"highlights", DocumentHighlightResponse, ErrorResponse>
  >;
  diagnostics: Handler<
    DiagnosticsCommand,
    Result<"diagnostics", DiagnosticsResponse, ErrorResponse>
  >;
  shutdown: () => Promise<void>;
  then: (
    resolve: (code: number | null) => void,
    reject: (err: Error) => void
  ) => Promise<void>;
};

const lspCommand = "eclair lsp";

// Argument only used during testing
export const _eclairLsp = (command: string = lspCommand): EclairLsp => {
  const eclair = runSubProcess(command);

  const write = async <T>(msg: object) => {
    const response = await eclair.write(JSON.stringify(msg));
    return JSON.parse(response as string) as T;
  };

  const writeCommand = <T>(type: CommandType, command: object) =>
    write<T>({ type, command });

  const shutdown = async () => {
    await write({ type: "shutdown" });
    eclair.shutdown();
  };

  const updateVFS = (command: UpdateVFSCommand) =>
    writeCommand<SuccessResponse>("update-vfs", command);
  const hover = (command: HoverCommand) =>
    writeCommand<Result<"hover", HoverResponse, ErrorResponse>>(
      "hover",
      command
    );
  const documentHighlight = (command: DocumentHighlightCommand) =>
    writeCommand<
      Result<"highlights", DocumentHighlightResponse, ErrorResponse>
    >("document-highlight", command);
  const diagnostics = (command: DiagnosticsCommand) =>
    writeCommand<Result<"diagnostics", DiagnosticsResponse, ErrorResponse>>(
      "diagnostics",
      command
    );
  return {
    then: eclair.then,
    shutdown,
    updateVFS,
    hover,
    documentHighlight,
    diagnostics,
  };
};

const eclairLsp = () => _eclairLsp();

export default eclairLsp;
