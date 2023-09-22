run:
	bun run ./src/index.ts --stdio

test:
	bun test

install:
	bun i

clean:
	rm -rf dist/
	rm -rf node_modules/

.PHONY: run test install clean
