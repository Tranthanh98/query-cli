import postgres, { type Sql } from "postgres"
import type {
  ColumnInfo,
  ConnectionConfig,
  DatabaseDriver,
  QueryOptions,
  QueryResult,
} from "./types"

// Cheap detection for row-returning statements. postgres-js's .cursor() only
// works on these; INSERT/UPDATE/DELETE/DDL must use plain .unsafe().
const ROW_RETURNING = /^\s*(?:--[^\n]*\n|\/\*[\s\S]*?\*\/|\s)*(SELECT|WITH|SHOW|EXPLAIN|VALUES|TABLE)\b/i

export class PostgresDriver implements DatabaseDriver {
  readonly kind = "postgres" as const
  private sql: Sql | null = null

  async connect(config: ConnectionConfig): Promise<void> {
    this.sql = postgres({
      host: config.host ?? "localhost",
      port: config.port ?? 5432,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    await this.sql`select 1`
  }

  async disconnect(): Promise<void> {
    if (this.sql) {
      await this.sql.end({ timeout: 5 })
      this.sql = null
    }
  }

  async query(sqlText: string, options?: QueryOptions): Promise<QueryResult> {
    if (!this.sql) throw new Error("Not connected")
    const cap = options?.maxRows ?? Number.POSITIVE_INFINITY

    let collected: Record<string, unknown>[] = []
    let truncated = false

    if (ROW_RETURNING.test(sqlText) && Number.isFinite(cap)) {
      // Fetch one batch of cap+1 rows; if we get the +1, we know there's more
      // and we mark truncated. The server-side cursor avoids buffering the
      // whole result set client-side.
      const batchSize = (cap as number) + 1
      const cursor = this.sql.unsafe(sqlText).cursor(batchSize)
      for await (const batch of cursor) {
        for (const row of batch) {
          if (collected.length >= cap) {
            truncated = true
            break
          }
          collected.push(row as Record<string, unknown>)
        }
        // First batch already exceeded the cap, or filled it exactly with
        // nothing left — either way, stop.
        break
      }
    } else {
      const result = await this.sql.unsafe(sqlText)
      collected = result as unknown as Record<string, unknown>[]
      // postgres-js: Result.count holds the affected-row count for
      // INSERT/UPDATE/DELETE without RETURNING (the array itself is empty).
      if (collected.length === 0) {
        const affected = (result as unknown as { count?: number }).count
        if (typeof affected === "number") {
          return { columns: [], rows: [], rowCount: affected, truncated: false }
        }
      }
    }

    const columns = collected.length > 0 ? Object.keys(collected[0]!) : []
    return {
      columns,
      rows: collected.map((r) => columns.map((c) => r[c])),
      rowCount: collected.length,
      truncated,
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.sql) throw new Error("Not connected")
    const rows = (await this.sql`
      SELECT schemaname, tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `) as unknown as Array<{ schemaname: string; tablename: string }>
    return rows.map((r) =>
      r.schemaname === "public" ? r.tablename : `${r.schemaname}.${r.tablename}`,
    )
  }

  async listColumns(table: string): Promise<ColumnInfo[]> {
    if (!this.sql) throw new Error("Not connected")
    const dotIndex = table.indexOf(".")
    const schema = dotIndex >= 0 ? table.slice(0, dotIndex) : "public"
    const tableName = dotIndex >= 0 ? table.slice(dotIndex + 1) : table
    const rows = (await this.sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = ${schema} AND table_name = ${tableName}
      ORDER BY ordinal_position
    `) as unknown as Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>
    return rows.map((r) => ({
      name: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable === "YES",
    }))
  }
}
