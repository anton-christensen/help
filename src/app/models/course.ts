export class Course {
  id: string;
  title: string;
  slug: string;
  instituteSlug: string;
  enabled: boolean;

  constructor(id: string, title: string, instituteSlug: string, slug: string, enabled: boolean) {
    this.id = id;
    this.title = title;
    this.instituteSlug = instituteSlug;
    this.slug = slug;
    this.enabled = enabled;
  }
}
