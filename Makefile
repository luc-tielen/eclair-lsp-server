run:
	bun run ./src/index.ts

build:
	bun build ./src/index.ts

test:
	bun test

install:
	bun i

clean:
	rm -rf node_modules

.PHONY: run build test install clean
