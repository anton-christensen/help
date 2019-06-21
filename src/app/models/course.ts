export class Course {
  id: string;
  title: string;
  slug: string;
  instituteSlug: string;
  enabled: boolean;
  binMen: string[];

  constructor(id: string, title: string, instituteSlug: string, slug: string) {
    this.id = id;
    this.title = title;
    this.instituteSlug = instituteSlug;
    this.slug = slug;
    this.enabled = false;
    this.binMen = [];
  }
}
