import type { AiTool, ToolContext } from "./types"

export function makeSchemaTools(ctx: ToolContext): AiTool[] {
  return [
    {
      name: "list_tables",
      description: "List every table available in the connected database.",
      argsSchema: { type: "object", properties: {} },
      async execute() {
        return ctx.tables()
      },
    },
    {
      name: "get_columns",
      description:
        "Return the columns (name, type, nullable) for a given table. Call this before writing SQL against a table you have not inspected yet.",
      argsSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "The table name to inspect." },
        },
        required: ["table"],
      },
      async execute(args) {
        const table = String(args.table ?? "")
        return ctx.columns(table)
      },
    },
    {
      name: "search_tables",
      description:
        "Find tables whose names contain the given keyword (case-insensitive substring match). Returns at most 20 hits.",
      argsSchema: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Substring to search for." },
        },
        required: ["keyword"],
      },
      async execute(args) {
        const keyword = String(args.keyword ?? "").toLowerCase()
        const tables = await ctx.tables()
        return tables
          .filter((t) => t.toLowerCase().includes(keyword))
          .slice(0, 20)
      },
    },
    {
      name: "sample_rows",
      description:
        "Run SELECT * FROM <table> LIMIT N and return up to 20 rows. Use this only when you need to see real data shapes (e.g. JSON column structure, enum values).",
      argsSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "The table to sample." },
          limit: {
            type: "integer",
            description: "Row cap (default 5, max 20).",
          },
        },
        required: ["table"],
      },
      async execute(args) {
        const table = String(args.table ?? "")
        const requested = Number(args.limit ?? 5)
        const limit = Math.max(1, Math.min(20, Number.isFinite(requested) ? requested : 5))
        // Always quote the identifier for safety in AI-generated queries
        const quoted =
          ctx.driver.kind === "mysql"
            ? "`" + table.replace(/`/g, "``") + "`"
            : '"' + table.replace(/"/g, '""') + '"'
        const sql = `SELECT * FROM ${quoted} LIMIT ${limit}`
        const result = await ctx.driver.query(sql, { maxRows: limit })
        return { columns: result.columns, rows: result.rows }
      },
    },
  ]
}
