import { expect } from "chai";
import { readFileSync } from "fs";
import { _eclairLsp as eclairLsp } from "../src/eclair-lsp";

const parseSentCommand = (file: string) =>
  JSON.parse(readFileSync(file, { encoding: "utf-8" }));

// NOTE: none of these check the output, that would require running the actual LSP.
// (or fake the responses also, but that doesn't test much here..)

describe("Eclair LSP subprocess", () => {
  it("is possible to shutdown the Eclair process", async () => {
    // The following commands waits for user input.
    const lsp = eclairLsp("./tests/fixtures/fake-lsp.sh /tmp/file");
    lsp.shutdown();
    const code = await lsp;
    expect(code).to.eql(0);
  });

  it("is possible to update the VFS", async () => {
    const outputFile = "/tmp/vfs-output.json";
    const lsp = eclairLsp(`./tests/fixtures/fake-lsp.sh ${outputFile}`);
    const msg = {
      file: "/tmp/file.eclair",
      contents: "@def edge(u32, u32) input.",
    };

    await lsp.updateVFS(msg);
    expect(parseSentCommand(outputFile)).to.eql({
      type: "update-vfs",
      command: msg,
    });

    await lsp;
  });

  it("should support getting hover information", async () => {
    const outputFile = "/tmp/hover-output.json";
    const lsp = eclairLsp(`./tests/fixtures/fake-lsp.sh ${outputFile}`);
    const msg = {
      file: "/tmp/file.eclair",
      position: { line: 8, column: 5 },
    };

    await lsp.hover(msg);
    expect(parseSentCommand(outputFile)).to.eql({
      type: "hover",
      command: msg,
    });

    await lsp;
  });

  it("should support document highlight", async () => {
    const outputFile = "/tmp/doc-highlight-output.json";
    const lsp = eclairLsp(`./tests/fixtures/fake-lsp.sh ${outputFile}`);
    const msg = {
      file: "/tmp/file.eclair",
      position: { line: 8, column: 5 },
    };

    await lsp.documentHighlight(msg);
    expect(parseSentCommand(outputFile)).to.eql({
      type: "document-highlight",
      command: msg,
    });

    await lsp;
  });

  it("should supports getting diagnostic information", async () => {
    const outputFile = "/tmp/doc-highlight-output.json";
    const lsp = eclairLsp(`./tests/fixtures/fake-lsp.sh ${outputFile}`);
    const msg = { file: "/tmp/file.eclair" };

    await lsp.diagnostics(msg);
    expect(parseSentCommand(outputFile)).to.eql({
      type: "diagnostics",
      command: msg,
    });

    await lsp;
  });

  // TODO
  // it("can handle hover errors");
  // it("can handle diagnostic errors");
  // it("can handle document highlight errors");
});
