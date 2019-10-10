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

  private static ensureDatabaseExists(databaseName: string): Promise<void> {
    return this.r.dbList().contains(databaseName).do((databaseExists: any) => {
      return r.branch(
        databaseExists,
        { dbs_created: 0 },
        r.dbCreate(databaseName)
      );
    }).run(this.connection);
  }

  private static ensureTableExists(tableName: string, primaryKeyName: string = "id"): Promise<void> {
    console.log(`making sure the table ${tableName} exists`);
    return new Promise<void>((resolve, reject) => {
      this.db.tableList().run(this.connection).then(tableList => {
        if(tableList.findIndex(t => t === tableName) >= 0) { // table exists
          resolve();
        } else { // table doesn't exist, so create it
          this.db.tableCreate(tableName, {primaryKey: primaryKeyName}).run(this.connection).then(table => {
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
      return Promise.all([
        this.ensureDatabaseExists('help'),
      ]).then(() => {
        return Promise.all([
          this.ensureTableExists('authTokens', 'hash'),
          this.ensureTableExists('courses'),
          this.ensureTableExists('departments'),
          this.ensureTableExists('notificationTokens'),
          this.ensureTableExists('posts'),
          this.ensureTableExists('trashCans'),
          this.ensureTableExists('users'),
        ]);
      }).then(() => {
        return Promise.all([
          this.ensureIndexExists('users', 'email'),
          this.ensureIndexExists('trashCans', 'created'),
        ]);
      }).then(() => {
        return Promise.all([
          this.db.wait({waitFor: 'ready_for_writes'}).run(this.connection),
          this.db.wait({waitFor: 'ready_for_reads'}).run(this.connection),
        ]);
      }).then(() => {
        return Promise.all([
          this.provision(),
          // remove user ID from inactive trashCans
          Database.trashCans.filter({active: false}).replace(r.row.without('userID')).run(Database.connection)
        ]);
      })
      .then(() => {
        resolve();
      })
      .catch(err => reject(err));
    });
  }
  


  private static provision(): Promise<void> {
    // if departments is empty
    return new Promise<void>((resolve, reject) => {
      return Promise.all([
        this.provisionUsers(),
        this.provisionDepartments(),
        this.provisionCourses(),
      ]).then(() => resolve())
    });
  }

  private static provisionDepartments(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.departments.count().eq(0).do((isEmpty: any) => 
        r.branch(
          isEmpty, 
          this.departments.insert([
            {
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              numCourses: 0 ,
              slug: "soc" ,
              title: "Department of Electronic Systems",
              title_da: "Institut for Elektroniske Systemer",
              title_en: "Department of Electronic Systems"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "soc" ,
              title: "Department of Energy Technology" ,
              title_da: "Institut for Energiteknik" ,
              title_en: "Department of Energy Technology"
            },{
              faculty: "The Faculty of Medicine" ,
              faculty_da: "Det Sundhedsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Medicine" ,
              numCourses: 0 ,
              slug: "soc" ,
              title: "Department of Health Science and Technology" ,
              title_da: "Institut for Medicin og Sundhedsteknologi" ,
              title_en: "Department of Health Science and Technology"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              numCourses: 0 ,
              slug: "soc" ,
              title: "Department of Sociology and Social Work" ,
              title_da: "Institut for Sociologi og Socialt Arbejde" ,
              title_en: "Department of Sociology and Social Work"
            },{
              faculty: "The Faculty of Medicine" ,
              faculty_da: "Det Sundhedsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Medicine" ,
              numCourses: 0 ,
              slug: "klinisk" ,
              title: "Department of Clinical Medicine" ,
              title_da: "Klinisk Institut" ,
              title_en: "Department of Clinical Medicine"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "math" ,
              title: "Department of Mathematical Sciences" ,
              title_da: "Institut for Matematiske Fag" ,
              title_en: "Department of Mathematical Sciences"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "civil" ,
              title: "Department of Civil Engineering" ,
              title_da: "Institut for Byggeri og Anlæg" ,
              title_en: "Department of Civil Engineering"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              numCourses: 0 ,
              slug: "plan" ,
              title: "Department of Planning" ,
              title_da: "Institut for Planlægning" ,
              title_en: "Department of Planning"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              numCourses: 0 ,
              slug: "dps" ,
              title: "Department of Political Science" ,
              title_da: "Institut for Politik og Samfund" ,
              title_en: "Department of Political Science"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "mp" ,
              title: "Department of Materials and Production" ,
              title_da: "Institut for Materialer og Produktion" ,
              title_en: "Department of Materials and Production"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "bio" ,
              title: "Department of Chemistry and Bioscience" ,
              title_da: "Institut for Kemi og Biovidenskab" ,
              title_en: "Department of Chemistry and Bioscience"
            },{
              faculty: "The Faculty of Humanities" ,
              faculty_da: "Det Humanistiske Fakultet" ,
              faculty_en: "The Faculty of Humanities" ,
              numCourses: 0 ,
              slug: "learning" ,
              title: "Department of Culture and Learning" ,
              title_da: "Institut for Kultur og Læring" ,
              title_en: "Department of Culture and Learning"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              numCourses: 0 ,
              slug: "business" ,
              title: "Department of Business and Management" ,
              title_da: "Institut for Økonomi og Ledelse" ,
              title_en: "Department of Business and Management"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              numCourses: 0 ,
              slug: "sbi" ,
              title: "Danish Building Research Institute" ,
              title_da: "Statens Byggeforskningsinstitut" ,
              title_en: "Danish Building Research Institute"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              numCourses: 3 ,
              slug: "cs" ,
              title: "Department of Computer Science" ,
              title_da: "Institut for Datalogi" ,
              title_en: "Department of Computer Science"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              numCourses: 0 ,
              slug: "create" ,
              title: "Department of Architecture, Design and Media Technology" ,
              title_da: "Institut for Arkitektur og Medieteknologi" ,
              title_en: "Department of Architecture, Design and Media Technology"
            },{
              faculty: "The Faculty of Medicine" ,
              faculty_da: "Det Sundhedsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Medicine" ,
              numCourses: 0 ,
              slug: "hst" ,
              title: "Department of Health Science and Technology" ,
              title_da: "Institut for Medicin og Sundhedsteknologi" ,
              title_en: "Department of Health Science and Technology"
            },{
              faculty: "The Faculty of Humanities" ,
              faculty_da: "Det Humanistiske Fakultet" ,
              faculty_en: "The Faculty of Humanities" ,
              numCourses: 0 ,
              slug: "hum" ,
              title: "Department of Communication and Psychology" ,
              title_da: "Institut for Kommunikation og Psykologi" ,
              title_en: "Department of Communication and Psychology"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              numCourses: 0 ,
              slug: "law" ,
              title: "Department of Law" ,
              title_da: "Juridisk Institut" ,
              title_en: "Department of Law"
            }
          ]), 
          {provision: false}
        )
      ).run(this.connection).then(() => resolve());
    });
  }


  private static provisionCourses(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.courses.count().eq(0).do((isEmpty: any) => 
        r.branch(
          isEmpty, 
          this.courses.insert([
            {
              associatedUserIDs: [] ,
              departmentSlug: "cs" ,
              enabled: false ,
              numTrashCansThisSession: 0 ,
              slug: "dtg" ,
              title: "Datalogiens Teoretiske Grundlag"
            }
          ]), 
          {provision: false}
        )
      ).run(this.connection).then(() => resolve());
    });
  }

  

  private static provisionUsers(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.users.count().eq(0).do((isEmpty: any) => 
        r.branch(
          isEmpty, 
          this.users.insert([
            {
              anon: false ,
              email: "hsaren14@student.aau.dk",
              name: "Henrik Herbst Sørensen" ,
              role: "admin"
            },{
              anon: false ,
              email: "achri15@student.aau.dk",
              name: "Anton Christensen" ,
              role: "admin"
            },
            // Test TAs
            {
              anon: false ,
              email: "kkjae19@test.aau.dk",
              name: "Kasper Kjær" ,
              role: "TA"
            },{
              anon: false ,
              email: "kfred19@test.aau.dk",
              name: "Katrine Frederiksen" ,
              role: "TA"
            },{
              anon: false ,
              email: "sjess19@test.aau.dk",
              name: "Selam Jessen" ,
              role: "TA"
            },{
              anon: false ,
              email: "joest19@test.aau.dk",
              name: "Julie Østergaards" ,
              role: "TA"
            },{
              anon: false ,
              email: "lbak19@test.aau.dk",
              name: "Lukas Bak" ,
              role: "TA"
            },{
              anon: false ,
              email: "mkarl19@test.aau.dk",
              name: "Mark Karlsen" ,
              role: "TA"
            }
          ]), 
          {provision: false}
        )
      ).run(this.connection).then(() => resolve());
    });
  }
}
