export const InstitutePath = 'institutes';

export class Institute {
    id: string; 
    title: string;
    slug: string;
    faculty: string;
  
    constructor(id: string, title: string, slug: string, faculty: string) {
      this.id = id;
      this.title = title;
      this.slug = slug;
      this.faculty = faculty;
    }
}
