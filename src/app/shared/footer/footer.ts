import { Component, VERSION } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  currentYear: number = new Date().getFullYear();
  companyName: string = 'Agent Ltd.';
  angularVersion: string = VERSION.full;

}
