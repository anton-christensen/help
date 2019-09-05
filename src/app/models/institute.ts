export const InstitutePath = 'institutes';

export interface Institute {
    id: string;
    title: string;
    slug: string;
    faculty: string;
    numCourses: number;
}
