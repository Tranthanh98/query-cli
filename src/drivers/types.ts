export type DriverKind = "postgres" | "sqlite" | "mysql"

export interface ConnectionConfig {
  id: string
  name: string
  driver: DriverKind
  host?: string
  port?: number
  database: string
  user?: string
  password?: string
}

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
  rowCount: number
  /** True when the driver stopped fetching because `maxRows` was hit. */
  truncated?: boolean
}

export interface QueryOptions {
  /** Hard cap on rows returned. The driver must stop fetching past this. */
  maxRows?: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
}

export interface DatabaseDriver {
  readonly kind: DriverKind
  connect(config: ConnectionConfig): Promise<void>
  disconnect(): Promise<void>
  query(sql: string, options?: QueryOptions): Promise<QueryResult>
  listTables(): Promise<string[]>
  listColumns(table: string): Promise<ColumnInfo[]>
}

export const DEFAULT_ROW_CAP = 1000
