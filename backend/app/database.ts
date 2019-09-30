import { r, RDatabase, RTable, Connection } from 'rethinkdb-ts';

export class Database {

  private static _connection: Connection;
  public static get connection() { return this._connection; }

  public static get dbName(): string { return 'help'; } /// @todo: adjust via env

  public static _r: typeof r = r
  public static get r(): typeof r { return this._r; }

  public static get db(): RDatabase { return r.db(this.dbName); }
  
  public static get trashCans(): RTable { return this.db.table('trashCans'); }
  public static get notificationTokens(): RTable { return this.db.table('notificationTokens'); }
  public static get departments(): RTable { return this.db.table('departments'); }
  public static get courses(): RTable { return this.db.table('courses'); }
  public static get posts(): RTable { return this.db.table('posts'); }
  public static get users(): RTable { return this.db.table('users'); }

  public static init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log("connecting to database");
      this.r.connect({
        host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 28015
      }).then(conn => {
        console.log("got database connection");
        console.log("ensuring database is in valid state");
        conn.use(this.dbName);
        this._connection = conn;
        return Promise.all([
          this.makeTablesAndIndexes(),
        ]);
      }).then(() => resolve())
      .catch(err => { reject(err); return; });
    });
  }

  private static ensureTableExists(tableName: string): Promise<void> {
    console.log(`making sure the table ${tableName} exists`);
    return new Promise<void>((resolve, reject) => {
      this.db.tableList().run(this.connection).then(tableList => {
        if(tableList.findIndex(t => t === tableName) >= 0) { // table exists
          resolve();
        } else { // table doesn't exist, so create it
          this.db.tableCreate(tableName).run(this.connection).then(table => {
            resolve();
          });
        }
      }).catch(err => reject(err));
    });
  }

  private static ensureIndexExists(tableName: string, indexName: string): Promise<void> {
    console.log(`making sure the index ${indexName} on ${tableName} exists`);
    return new Promise<void>((resolve, reject) => {
      // assumes that table exists      
      this.db.table(tableName).indexList().run(this.connection).then(indexList => {
        if(indexList.findIndex(t => t === indexName) < 0) { // if index doesn't exist
        console.log("it doesn't exist");
        this.db.table(tableName).indexCreate(indexName).run(this.connection)
              .then(index => resolve()).catch(err => {console.log("failed to create it")});
        } else resolve();
      }).catch(err => reject(err));
    });
  }

  private static makeTablesAndIndexes(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      Promise.all([
        this.ensureTableExists('authTokens'),
        this.ensureTableExists('courses'),
        this.ensureTableExists('departments'),
        this.ensureTableExists('notificationTokens'),
        this.ensureTableExists('posts'),
        this.ensureTableExists('trashCans'),
        this.ensureTableExists('users'),
      ]).then(() => {
        return Promise.all([
          this.ensureIndexExists('users', 'email'),
          this.ensureIndexExists('trashCans', 'created'),
        ]).then(() => {
          resolve();
        });
      }).catch(err => reject(err));
    });
  }
}
