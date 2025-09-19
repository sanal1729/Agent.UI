import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/states/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  isDropdownOpen = false;

  loginUser : string | null = null;

  constructor(private router: Router,private authStore: AuthStore) { }

 
    ngOnInit(): void {
      this.loginUser = this.authStore.user()?.firstName || null;
    
    }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth']);
  }
}
