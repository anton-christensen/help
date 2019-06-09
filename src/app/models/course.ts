export class Course {
  id: string; 
  title: string;
  slug: string;
  institute: string;
  enabled: boolean;

  constructor(id: string, title: string, institute: string, slug: string, enabled: boolean) {
    this.id = id;
    this.title = title;
    this.institute = institute;
    this.slug = slug;
    this.enabled = enabled;
  }
}
