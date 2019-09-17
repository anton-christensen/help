import {Injectable} from '@angular/core';
import {AngularFirestore, QueryFn} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Institute, InstitutePath } from '../models/institute';
import {CommonService} from './common.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {
  private institutes: Institute[] = [
    { title: 'Department of Culture and Learning', slug: 'learning' },
    { title: 'Department of Chemistry and Bioscience', slug: 'bio' },
    { title: 'Danish Building Research Institute', slug: 'sbi' },
    { title: 'Department of Communication and Psychology', slug: 'hum' },
    { title: 'Department of Materials and Production', slug: 'mp' },
    { title: 'Department of Political Science', slug: 'dps' },
    { title: 'Department of Architecture, Design and Media Technology', slug: 'create' },
    { title: 'Department of Mathematical Sciences', slug: 'math' },
    { title: 'Department of Sociology and Social Work', slug: 'soc' },
    { title: 'Department of Computer Science', slug: 'cs' },
    { title: 'Department of Law', slug: 'law' },
    { title: 'Department of Clinical Medicine', slug: 'klinisk' },
    { title: 'Department of Health Science and Technology', slug: 'hst' },
    { title: 'Department of Planning', slug: 'plan' },
    { title: 'Department of Civil Engineering', slug: 'civil' },
    { title: 'Department of Business and Management', slug: 'business' },
  ];

  constructor(private afStore: AngularFirestore) {
    this.institutes = this.institutes.sort((a, b) => a.title.localeCompare(b.title));
  }

  public getAll(): Institute[] {
    return this.institutes;
  }

  public getBySlug(slug: string): Institute {
    return this.institutes.find((i) => i.slug === slug);
  }

  public isActualInstitute(slug: string): boolean {
    return !!this.getBySlug(slug);
  }
}
