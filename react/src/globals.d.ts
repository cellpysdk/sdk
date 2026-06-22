// process.env is replaced at build time by the consumer's bundler (Next.js / Vite / webpack).
// This declaration lets TypeScript accept process.env.* without pulling in full @types/node.
declare const process: { env: Record<string, string | undefined> };
