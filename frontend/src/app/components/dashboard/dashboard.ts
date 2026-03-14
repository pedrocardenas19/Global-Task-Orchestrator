import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TaskForm } from '../task-form/task-form';
import { TaskList } from '../task-list/task-list';

@Component({
  selector: 'app-dashboard',
  imports: [MatIconModule, TaskForm, TaskList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // The task list updates reactively via the shared BehaviorSubject in TaskService.
  // No manual refresh is needed — createTask() triggers loadTasks() via switchMap,
  // which pushes the new list to tasks$, and AsyncPipe re-renders the view.
}
