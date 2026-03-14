# Frontend — Global Task Orchestrator

## Stack

| Tecnología | Versión | Por qué |
|---|---|---|
| Angular | 21.2 | Framework requerido. Versión LTS más reciente con standalone components y signals |
| Angular Material | 21.2 | Sistema de componentes UI consistente con soporte accesibilidad ARIA |
| RxJS | 7.8 | Manejo reactivo del estado: observables, BehaviorSubject, switchMap |
| SCSS | — | Variables CSS, anidamiento, mixins; ya incluido en Angular CLI |
| TypeScript | 5.9 (strict) | Tipado fuerte con `strict: true` para detectar errores en compilación |

---

## Arquitectura

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/      # Layout principal + header sticky
│   │   ├── task-form/      # Formulario reactivo para crear tareas
│   │   └── task-list/      # Lista reactiva de tareas
│   ├── models/
│   │   └── task.model.ts   # Interfaces TypeScript: Task, CreateTaskDto, TaskStatus
│   ├── services/
│   │   └── task.ts         # TaskService: estado + llamadas HTTP
│   ├── app.ts              # Root component (standalone)
│   └── app.config.ts       # Providers: HttpClient, Animations
├── environments/
│   ├── environment.ts              # Dev: apunta a localhost:3000
│   └── environment.production.ts  # Prod: apunta a /api (relativo)
└── styles.scss             # Design tokens globales + Material overrides
```

### Decisiones de arquitectura

**Standalone components (sin NgModule)**
Angular 21 recomienda no usar módulos. Cada componente declara sus propios `imports`, lo que hace el árbol de dependencias explícito y mejora el tree-shaking del bundle.

**Un único servicio de estado (`TaskService`)**
En lugar de tener el estado disperso entre componentes, `TaskService` actúa como la única fuente de verdad mediante un `BehaviorSubject<Task[]>`. Cualquier componente que se suscriba a `tasks$` recibe actualizaciones automáticamente sin comunicación padre-hijo.

**`switchMap` en lugar de `tap + subscribe`**
```typescript
// ❌ Anti-pattern: subscribe anidado crea memory leaks
createTask(dto).pipe(tap(() => this.loadTasks().subscribe()))

// ✅ Correcto: switchMap cancela el observable anterior y encadena
createTask(dto).pipe(switchMap(() => this.loadTasks()))
```
`switchMap` garantiza que si se crea una segunda tarea antes de que termine el GET de la primera, el observable anterior se cancela y solo el último GET actualiza el estado.

**`inject()` en lugar de constructor injection (TaskList)**
```typescript
// Patrón moderno Angular 14+
private taskService = inject(TaskService);
// tasks$ puede inicializarse en la misma línea porque inject() se resuelve antes
tasks$ = this.taskService.tasks$;
```
Con el constructor tradicional, `this.taskService` no existe al momento en que se evalúan las propiedades de clase, causando un error TypeScript con `strict: true`.

---

## Flujo de datos

```
Usuario escribe título/descripción
        ↓
TaskForm (ReactiveForm) valida
        ↓
taskService.createTask(dto)
        ↓  POST /tasks
  API Rails devuelve la tarea creada
        ↓  switchMap
  GET /tasks (lista completa actualizada)
        ↓  tap
  BehaviorSubject.next(tasks)
        ↓  AsyncPipe
TaskList re-renderiza automáticamente
```

No hay event emitters entre Dashboard, TaskForm y TaskList para el refresco. El BehaviorSubject hace el trabajo: quien tiene el dato centralizado notifica a todos los suscriptores.

---

## Estado reactivo con RxJS

```typescript
// En TaskService
private tasksSubject = new BehaviorSubject<Task[]>([]);
public tasks$ = this.tasksSubject.asObservable();
```

- `BehaviorSubject` guarda el último valor emitido y lo entrega inmediatamente a cualquier suscriptor nuevo (útil para el estado inicial al cargar la página).
- Se expone solo como `Observable` (`.asObservable()`) para que nadie fuera del servicio pueda hacer `.next()` directamente.

```typescript
// En TaskList, el AsyncPipe maneja suscripción Y unsubscribe automático
tasks$ = this.taskService.tasks$;
```
```html
@if (tasks$ | async; as tasks) { ... }
```
AsyncPipe se suscribe en `ngOnInit` y se desuscribe en `ngOnDestroy` sin código adicional, eliminando posibles memory leaks.

---

## Formulario reactivo

Se usa `ReactiveFormsModule` (no Template-driven) porque:
- El estado del form es predecible y testeable
- Las validaciones son código TypeScript, no atributos HTML
- Es el estándar recomendado para formularios que se envían a una API

```typescript
this.form = this.fb.group({
  title: ['', [Validators.required, Validators.minLength(3)]],
  description: [''],  // opcional
});
```

El botón "Save" se deshabilita mientras `form.invalid || isLoading` sea `true`, previniendo envíos duplicados.

---

## Variables de entorno

La URL del API nunca está hardcodeada en el código fuente:

```typescript
// environment.ts (desarrollo)
export const environment = { production: false, apiUrl: 'http://localhost:3000' };

// environment.production.ts (producción)
export const environment = { production: true, apiUrl: '/api' };
```

`angular.json` configura `fileReplacements` para que en `ng build` (producción) el archivo de dev sea reemplazado automáticamente por el de producción.

---

## Design system

El diseño usa CSS custom properties definidas en `styles.scss` como única fuente de verdad para colores, tipografía y espaciado:

```scss
:root {
  --bg-base:    #0d0d0f;   // fondo de la app
  --bg-surface: #141418;   // paneles
  --bg-elevated:#1c1c22;   // inputs y tarjetas
  --border:     #2a2a35;

  --accent-cyan:   #00e5ff; // primario (botones, focus, glow)
  --accent-purple: #b57bee; // secundario
  --accent-lime:   #aaff00; // estado "completed"
  --accent-amber:  #ffb830; // estado "pending"

  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace; // badges, fechas, labels técnicos
}
```

Angular Material se sobreescribe al nivel de CSS custom properties (no con `!important` en cascada), usando el theming API de Material 3:

```scss
html {
  @include mat.theme((
    color: (primary: mat.$cyan-palette, theme-type: dark),
  ));
}
```

---

## Herramientas de calidad

### Prettier — se mantiene
Prettier está configurado (`.prettierrc`) y **se conserva** porque:
- Elimina debates de estilo en code review
- El parser `"angular"` para HTML formatea los templates correctamente
- En una prueba técnica, el código formateado consistentemente refleja madurez profesional

```json
{ "printWidth": 100, "singleQuote": true, "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }] }
```

### TypeScript strict mode
`tsconfig.json` activa el modo estricto completo:
- `strict: true` — inferencia y null-checks estrictos
- `strictTemplates: true` — los templates HTML también son type-checked
- `noImplicitReturns: true` — todas las ramas deben retornar valor

### `data-testid` en todos los elementos clave
Cada elemento interactivo tiene un atributo `data-testid` para que los tests E2E (Cypress/Playwright) no dependan de clases CSS que pueden cambiar:

```html
<form data-testid="task-form">
  <input data-testid="task-title-input" />
  <button data-testid="submit-button">Save</button>
</form>
<div data-testid="task-list">
  <div data-testid="task-item">...</div>
</div>
```

---

## Scripts disponibles

```bash
npm start          # ng serve — dev server en localhost:4200
npm run build      # ng build — build de producción con environment.production.ts
npm test           # ng test — unit tests con Vitest
```

---

## Cómo conectar con el Backend

El frontend espera que el backend Rails corra en `http://localhost:3000` con:

| Método | Endpoint | Body | Respuesta |
|--------|----------|------|-----------|
| `GET` | `/tasks` | — | `Task[]` ordenadas por `createdAt` desc |
| `POST` | `/tasks` | `{ title, description }` | `Task` creada |

Si la API devuelve un error con `{ message: "..." }`, el formulario lo muestra en pantalla automáticamente.

Para producción, se requiere configurar CORS en Rails para permitir el origen del frontend, y actualizar `environment.production.ts` con la URL real del API.
