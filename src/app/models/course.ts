export class Course {
  id: string; 
  title: string;
  slug: string;
  enabled: boolean;

  constructor(id: string, title: string, slug: string, enabled: boolean) {
    this.id = id;
    this.title = title;
    this.slug = slug;
    this.enabled = enabled;
  }
}
