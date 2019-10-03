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
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              id: "31934b0e-a31d-4683-9ecf-3b36f0f2310c" ,
              numCourses: 0 ,
              slug: "soc" ,
              title: "Department of Sociology and Social Work" ,
              title_da: "Institut for Sociologi og Socialt Arbejde" ,
              title_en: "Department of Sociology and Social Work"
            },{
              faculty: "The Faculty of Medicine" ,
              faculty_da: "Det Sundhedsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Medicine" ,
              id: "a5c9db94-2d31-4cad-a411-4ab979082b3e" ,
              numCourses: 0 ,
              slug: "klinisk" ,
              title: "Department of Clinical Medicine" ,
              title_da: "Klinisk Institut" ,
              title_en: "Department of Clinical Medicine"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              id: "4eed8f7a-f616-4d57-a990-a01bf67dc42e" ,
              numCourses: 0 ,
              slug: "math" ,
              title: "Department of Mathematical Sciences" ,
              title_da: "Institut for Matematiske Fag" ,
              title_en: "Department of Mathematical Sciences"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              id: "641ae1b0-e11a-4e9a-9dc6-ff05f0c111cc" ,
              numCourses: 0 ,
              slug: "civil" ,
              title: "Department of Civil Engineering" ,
              title_da: "Institut for Byggeri og Anlæg" ,
              title_en: "Department of Civil Engineering"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              id: "57f96dd9-7b7c-49e4-ae2a-ee76312cc056" ,
              numCourses: 0 ,
              slug: "plan" ,
              title: "Department of Planning" ,
              title_da: "Institut for Planlægning" ,
              title_en: "Department of Planning"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              id: "1b3dfca1-9ddf-460f-9dc9-cd704cd2b0cf" ,
              numCourses: 0 ,
              slug: "dps" ,
              title: "Department of Political Science" ,
              title_da: "Institut for Statskundskab" ,
              title_en: "Department of Political Science"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              id: "98ec0a94-4869-4501-9525-0b16fe0bd0cb" ,
              numCourses: 0 ,
              slug: "mp" ,
              title: "Department of Materials and Production" ,
              title_da: "Institut for Materialer og Produktion" ,
              title_en: "Department of Materials and Production"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              id: "340426c8-1c11-4d1b-88ec-8d44ac675a90" ,
              numCourses: 0 ,
              slug: "bio" ,
              title: "Department of Chemistry and Bioscience" ,
              title_da: "Institut for Kemi og Biovidenskab" ,
              title_en: "Department of Chemistry and Bioscience"
            },{
              faculty: "The Faculty of Humanities" ,
              faculty_da: "Det Humanistiske Fakultet" ,
              faculty_en: "The Faculty of Humanities" ,
              id: "68f0fe08-a034-45dc-a9af-189dbc139962" ,
              numCourses: 0 ,
              slug: "learning" ,
              title: "Department of Culture and Learning" ,
              title_da: "Institut for Kultur og Læring" ,
              title_en: "Department of Culture and Learning"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              id: "389e93b0-e509-4fb4-b986-f9c970678612" ,
              numCourses: 0 ,
              slug: "business" ,
              title: "Department of Business and Management" ,
              title_da: "Institut for Økonomi og Ledelse" ,
              title_en: "Department of Business and Management"
            },{
              faculty: "The Faculty of Engineering and Science" ,
              faculty_da: "Det Ingeniør- og Naturvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Engineering and Science" ,
              id: "9ee3ad8d-bf96-4e5e-a430-e8d417d18880" ,
              numCourses: 0 ,
              slug: "sbi" ,
              title: "Danish Building Research Institute" ,
              title_da: "Statens Byggeforskningsinstitut" ,
              title_en: "Danish Building Research Institute"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              id: "a8b25313-4b7c-42f4-b17f-fea38721a126" ,
              numCourses: 3 ,
              slug: "cs" ,
              title: "Department of Computer Science" ,
              title_da: "Institut for Datalogi" ,
              title_en: "Department of Computer Science"
            },{
              faculty: "The Technical Faculty of IT and Design" ,
              faculty_da: "Det Tekniske Fakultet for IT og Design" ,
              faculty_en: "The Technical Faculty of IT and Design" ,
              id: "4c65fca4-8e76-49bf-871f-e3e27ac7c945" ,
              numCourses: 0 ,
              slug: "create" ,
              title: "Department of Architecture, Design and Media Technology" ,
              title_da: "Institut for Arkitektur og Medieteknologi" ,
              title_en: "Department of Architecture, Design and Media Technology"
            },{
              faculty: "The Faculty of Medicine" ,
              faculty_da: "Det Sundhedsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Medicine" ,
              id: "b620c7b6-15a4-4f19-9e10-607ce58f8d31" ,
              numCourses: 0 ,
              slug: "hst" ,
              title: "Department of Health Science and Technology" ,
              title_da: "Institut for Medicin og Sundhedsteknologi" ,
              title_en: "Department of Health Science and Technology"
            },{
              faculty: "The Faculty of Humanities" ,
              faculty_da: "Det Humanistiske Fakultet" ,
              faculty_en: "The Faculty of Humanities" ,
              id: "ca0f3bc7-d53f-4923-a541-32f3c60dd99d" ,
              numCourses: 0 ,
              slug: "hum" ,
              title: "Department of Communication and Psychology" ,
              title_da: "Institut for Kommunikation og Psykologi" ,
              title_en: "Department of Communication and Psychology"
            },{
              faculty: "The Faculty of Social Sciences" ,
              faculty_da: "Det Samfundsvidenskabelige Fakultet" ,
              faculty_en: "The Faculty of Social Sciences" ,
              id: "b642c559-fce6-46fc-8131-b7a357888624" ,
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
