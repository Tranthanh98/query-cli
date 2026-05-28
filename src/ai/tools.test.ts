import { test, expect } from "bun:test"
import { makeSchemaTools } from "./tools"
import type { ToolContext } from "./types"

function makeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    driver: {
      kind: "postgres",
      connect: async () => {},
      disconnect: async () => {},
      query: async () => ({ columns: [], rows: [], rowCount: 0 }),
      listTables: async () => [],
      listColumns: async () => [],
    },
    tables: async () => ["users", "orders"],
    columns: async (t: string) =>
      t === "users"
        ? [{ name: "id", type: "int", nullable: false }]
        : [],
    ...overrides,
  }
}

test("list_tables returns all tables", async () => {
  const [list] = makeSchemaTools(makeCtx())
  expect(list?.name).toBe("list_tables")
  const result = await list!.execute({})
  expect(result).toEqual(["users", "orders"])
})

test("get_columns returns columns for a table", async () => {
  const tools = makeSchemaTools(makeCtx())
  const get = tools.find((t) => t.name === "get_columns")!
  const result = await get.execute({ table: "users" })
  expect(result).toEqual([{ name: "id", type: "int", nullable: false }])
})

test("search_tables substring-matches case-insensitively", async () => {
  const ctx = makeCtx({
    tables: async () => ["Users", "user_sessions", "orders"],
  })
  const search = makeSchemaTools(ctx).find((t) => t.name === "search_tables")!
  const result = await search.execute({ keyword: "USER" })
  expect(result).toEqual(["Users", "user_sessions"])
})

test("search_tables caps at 20 hits", async () => {
  const many = Array.from({ length: 50 }, (_, i) => `t_${i}`)
  const ctx = makeCtx({ tables: async () => many })
  const search = makeSchemaTools(ctx).find((t) => t.name === "search_tables")!
  const result = (await search.execute({ keyword: "t_" })) as string[]
  expect(result).toHaveLength(20)
})

test("sample_rows quotes identifier and caps limit at 20", async () => {
  const queries: string[] = []
  const ctx = makeCtx({
    driver: {
      ...makeCtx().driver,
      kind: "postgres",
      query: async (sql: string) => {
        queries.push(sql)
        return { columns: ["id"], rows: [[1]], rowCount: 1 }
      },
    },
  })
  const sample = makeSchemaTools(ctx).find((t) => t.name === "sample_rows")!
  await sample.execute({ table: "users", limit: 100 })
  expect(queries[0]).toBe('SELECT * FROM "users" LIMIT 20')
})

test("sample_rows defaults limit to 5", async () => {
  const queries: string[] = []
  const ctx = makeCtx({
    driver: {
      ...makeCtx().driver,
      query: async (sql: string) => {
        queries.push(sql)
        return { columns: [], rows: [], rowCount: 0 }
      },
    },
  })
  const sample = makeSchemaTools(ctx).find((t) => t.name === "sample_rows")!
  await sample.execute({ table: "users" })
  expect(queries[0]).toBe('SELECT * FROM "users" LIMIT 5')
})
