import { r, RDatabase, RTable, Connection } from 'rethinkdb-ts';

export class Database {

  private static _connection: Connection;
  public static get connection() { return this._connection; }

  public static get dbName(): string { return 'help'; } /// @todo: adjust via env

  public static _r: typeof r = r
  public static get r(): typeof r { return this._r; }

  public static get db(): RDatabase { return r.db(this.dbName); }

  public static get departments(): RTable { return this.db.table('departments'); }
  public static get courses(): RTable { return this.db.table('courses'); }
  public static get users(): RTable { return this.db.table('users'); }

  public static init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.r.connect({
        host: process.env.DB_HOST ? process.env.DB_HOST : 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 28015
      }).then(conn => {
        conn.use(this.dbName);
        this._connection = conn;
        Promise.all([
          this.initUsers()
        ]).then(() => resolve());
      }).catch(err => { reject(err); return; });
    });
  }

  private static initUsers(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.tableList().run(this.connection).then(tableList => {

        if(tableList.findIndex(t => t === 'users') >= 0) { // table exists

          this.users.indexList().run(this.connection).then(indexList => {

            if(indexList.findIndex(t => t === 'email') < 0) { // if index doesn't exist
              this.users.indexCreate('email').run(this.connection)
                  .then(index => resolve());
            } else resolve();
          });

        } else { // table doesn't exist, so create it
          this.db.tableCreate('users').run(this.connection).then(table => {

            // if table didn't exist, neither did the index; create it!
            this.users.indexCreate('email').run(this.connection)
                .then(index => resolve());
          });
        }
      }).catch(err => reject(err));
    });
  }
}
