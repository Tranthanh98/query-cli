import type {
  ColumnInfo,
  ConnectionConfig,
  DatabaseDriver,
  QueryOptions,
  QueryResult,
} from "./types"

export class MysqlDriver implements DatabaseDriver {
  readonly kind = "mysql" as const

  async connect(_config: ConnectionConfig): Promise<void> {
    throw new Error("MySQL driver is not implemented yet")
  }

  async disconnect(): Promise<void> {}

  async query(_sql: string, _options?: QueryOptions): Promise<QueryResult> {
    throw new Error("MySQL driver is not implemented yet")
  }

  async listTables(): Promise<string[]> {
    throw new Error("MySQL driver is not implemented yet")
  }

  async listColumns(_table: string): Promise<ColumnInfo[]> {
    throw new Error("MySQL driver is not implemented yet")
  }
}
