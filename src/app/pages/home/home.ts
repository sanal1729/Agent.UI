import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStore } from '../../core/states/auth.store';
// import { User } from '../../core/entities/classes/user';
// import { Store } from '@ngrx/store';
// import { AuthState } from '../../core/states/auth.state';
// import { selectUser } from '../../core/states/auth.selectors';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {


  constructor(private authStore: AuthStore) { }

  ngOnInit(): void {
    if (this.authStore.isAuthenticated()) {
      console.log('User:', this.authStore.user());
    }
  }

   plans = [
    {
      name: 'Basic',
      price: '$9/mo',
      features: ['1 Project', '5 GB Storage', 'Email Support'],
      buttonLabel: 'Select'
    },
    {
      name: 'Standard',
      price: '$19/mo',
      features: ['5 Projects', '20 GB Storage', 'Priority Support'],
      buttonLabel: 'Select'
    },
    {
      name: 'Premium',
      price: '$39/mo',
      features: ['Unlimited Projects', '100 GB Storage', 'Phone & Chat Support'],
      buttonLabel: 'Select'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['Custom Solutions', 'Dedicated Manager', '24/7 Support'],
      buttonLabel: 'Contact Us'
    }
  ];

}
