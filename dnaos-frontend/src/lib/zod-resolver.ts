import { zodResolver as _zodResolver } from "@hookform/resolvers/zod";

// Wraps zodResolver to isolate the Zod v3/v4 type-version mismatch that
// occurs when @hookform/resolvers resolves `zod` from a different location
// than the application code in pnpm's virtual store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver(schema: any) {
  return _zodResolver(schema);
}
