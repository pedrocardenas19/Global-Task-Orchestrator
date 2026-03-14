import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TaskService } from '../../services/task';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  imports: [AsyncPipe, DatePipe, MatCardModule, MatChipsModule, MatIconModule, MatProgressBarModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  private taskService = inject(TaskService);

  isLoading = true;
  tasks$ = this.taskService.tasks$;

  ngOnInit(): void {
    this.taskService.loadTasks().subscribe({
      complete: () => (this.isLoading = false),
      error: () => (this.isLoading = false),
    });
  }

  trackById(_index: number, task: Task): string {
    return task._id;
  }
}
