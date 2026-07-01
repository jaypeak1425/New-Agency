import "dotenv/config";
import { vi } from "vitest";

// lib/session.ts calls next/headers' cookies(), which only works inside a
// real Next.js request (Server Component/Route Handler/Server Action). Mock
// it with an in-memory jar so auth.ts's business logic is testable directly.
const store = new Map<string, { value: string }>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => store.get(name),
    set: (name: string, value: string) => {
      store.set(name, { value });
    },
    delete: (name: string) => {
      store.delete(name);
    },
  }),
}));
