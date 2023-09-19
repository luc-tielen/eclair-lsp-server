import { spawn } from "child_process";
import { createInterface } from "readline";

type ProcessCallbacks = {
  onClose: (code: number | null) => void;
  onError: (err: Error) => void;
};

const runSubProcessWithCallbacks = (
  command: string,
  { onClose, onError }: ProcessCallbacks
) => {
  const [cmd, ...args] = command.split(" ");

  const program = spawn(cmd, args, { stdio: "pipe" });
  const itf = createInterface(program.stdout);

  const resolvers: ((line: string) => void)[] = [];

  const write = (data: string) => {
    let resolver = (_line: string) => { };
    const promise = new Promise((resolve) => (resolver = resolve));
    resolvers.push(resolver);
    console.log("push");

    program.stdin.write(data + "\n");
    return promise;
  };

  const shutdown = () => {
    // First tear down interface linked to stdout, then rest of the process
    itf.close();
    program.kill();
  };

  program.stdout.setEncoding("utf8");

  // NOTE: right now this assumes every line written to the subprocess
  // returns also only 1 line
  itf.on("line", (line) => {
    const resolver = resolvers.shift();
    if (!resolver) {
      console.error("Received unexpected response:", line);
      shutdown();
      return;
    }

    resolver(line); // Resolve the corresponding promise
  });

  program.on("close", (code) => {
    itf.close();
    onClose(code);
  });

  program.on("error", (err) => {
    shutdown();
    onError(err);
  });

  return { write, shutdown };
};

const runSubProcess = (command: string) => {
  let resolveFn = (_code: number | null) => { };
  let rejectFn = (_err: Error) => { };
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  const { write, shutdown } = runSubProcessWithCallbacks(command, {
    onClose: resolveFn,
    onError: rejectFn,
  });

  return {
    then: async (resolve: (code: number | null) => void) => {
      const code = (await promise) as number | null;
      resolve(code);
    },
    write,
    shutdown,
  };
};

export default runSubProcess;
