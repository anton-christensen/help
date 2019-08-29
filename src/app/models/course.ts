import {User} from './user';

export const CoursePath = 'courses';

export class Course {
  id: string;
  title: string;
  slug: string;
  instituteSlug: string;
  enabled: boolean;
  associatedUserIDs: string[];
  associatedUsers?: User[];

  constructor(id: string, title: string, instituteSlug: string, slug: string) {
    this.id = id;
    this.title = title;
    this.instituteSlug = instituteSlug;
    this.slug = slug;
    this.enabled = false;
    this.associatedUserIDs = [];
  }
}
