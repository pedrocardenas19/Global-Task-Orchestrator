import { Component } from '@angular/core';
import { Dashboard } from './components/dashboard/dashboard';

@Component({
  selector: 'app-root',
  imports: [Dashboard],
  template: '<app-dashboard />',
  styleUrl: './app.scss'
})
export class App {}
