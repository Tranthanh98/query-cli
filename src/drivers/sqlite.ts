import { Database } from "bun:sqlite"
import type {
  ColumnInfo,
  ConnectionConfig,
  DatabaseDriver,
  QueryOptions,
  QueryResult,
} from "./types"

export class SqliteDriver implements DatabaseDriver {
  readonly kind = "sqlite" as const
  private db: Database | null = null

  async connect(config: ConnectionConfig): Promise<void> {
    this.db = new Database(config.database)
    this.db.query("SELECT 1").get()
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  async query(sqlText: string, options?: QueryOptions): Promise<QueryResult> {
    if (!this.db) throw new Error("Not connected")
    const stmt = this.db.query(sqlText)
    const columns = stmt.columnNames
    const cap = options?.maxRows ?? Number.POSITIVE_INFINITY

    // Non-row-returning statements (UPDATE/INSERT/DELETE/DDL): use .run() so
    // we get the affected-row count instead of iterating an empty result set.
    if (columns.length === 0) {
      const { changes } = stmt.run()
      return { columns: [], rows: [], rowCount: changes, truncated: false }
    }

    // Iterate row-by-row so an unbounded SELECT against a 1M-row table never
    // materializes the full result set in JS memory; stop at `cap`.
    const rows: unknown[][] = []
    let truncated = false
    for (const obj of stmt as Iterable<Record<string, unknown>>) {
      if (rows.length >= cap) {
        truncated = true
        break
      }
      rows.push(columns.map((c) => obj[c]))
    }

    return {
      columns,
      rows,
      rowCount: rows.length,
      truncated,
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.db) throw new Error("Not connected")
    const rows = this.db
      .query(
        `SELECT name FROM sqlite_master
         WHERE type IN ('table', 'view')
           AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>
    return rows.map((r) => r.name)
  }

  async listColumns(table: string): Promise<ColumnInfo[]> {
    if (!this.db) throw new Error("Not connected")
    const quoted = `"${table.replace(/"/g, '""')}"`
    const rows = this.db.query(`PRAGMA table_info(${quoted})`).all() as Array<{
      name: string
      type: string
      notnull: number
    }>
    return rows.map((r) => ({
      name: r.name,
      type: r.type,
      nullable: r.notnull === 0,
    }))
  }
}
