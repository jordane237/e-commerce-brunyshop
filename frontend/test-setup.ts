import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// Les deux applications Angular 22 sont zoneless : le TestBed l'est aussi.
setupTestBed({
  zoneless: true,
  teardown: { destroyAfterEach: true },
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
