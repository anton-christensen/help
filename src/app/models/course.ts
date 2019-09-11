export const CoursePath = 'courses';

export interface Course {
  id: string;
  title: string;
  slug: string;
  instituteSlug: string;
  enabled: boolean;
  associatedUserIDs: string[];
  numTrashCansThisSession: number;
}
