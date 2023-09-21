import runSubProcess from "../src/subprocess";

describe("runSubprocess", () => {
  it("is possible to communicate with the subprocess", async () => {
    const program = runSubProcess("./tests/fixtures/echo.sh");

    const msg1 = "test 123";
    const msg2 = "another message";
    const line = await program.write(msg1);
    const line2 = await program.write(msg2);
    expect(line).toBe(msg1);
    expect(line2).toBe(msg2);

    program.shutdown();
    const code = await program;
    expect(code).toBe(null); // null because it was shutdown
  });

  it("can wait for the program to run until completion", async () => {
    const program = runSubProcess("./tests/fixtures/echo_once.sh");

    const msg1 = "test 123";
    const line = await program.write(msg1);
    expect(line).toBe(msg1);

    const code = await program;
    expect(code).toBe(0);
  });

  it("resolves if program returns non-zero exit code", async () => {
    const program = runSubProcess("./tests/fixtures/always_fails.sh");
    const code = await program;
    expect(code).toBe(1);
  });

  it("throws if program not found", async () => {
    try {
      await runSubProcess("./tests/fixtures/not_found.sh");
    } catch (err) {
      expect((err as Error).message).toContain("Executable not found");
    }
  });
});
