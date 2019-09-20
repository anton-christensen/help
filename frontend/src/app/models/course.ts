export interface Course {
  id: string;
  title: string;
  slug: string;
  departmentSlug: string;
  enabled: boolean;
  associatedUserIDs: string[];
  numTrashCansThisSession: number;
}
