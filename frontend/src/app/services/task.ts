import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { Task, CreateTaskDto } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  // BehaviorSubject acts as the single source of truth for the task list
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Fetches all tasks from the API and pushes the result into the shared state */
  loadTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => this.tasksSubject.next(tasks))
    );
  }

  /** Posts a new task, then automatically refreshes the list via switchMap */
  createTask(dto: CreateTaskDto): Observable<Task[]> {
    return this.http.post<Task>(this.apiUrl, dto).pipe(
      switchMap(() => this.loadTasks())
    );
  }
}
