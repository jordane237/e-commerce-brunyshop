import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';

import { ProductFormComponent } from './product-form.component';

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard implements CanDeactivate<ProductFormComponent> {
  canDeactivate(component: ProductFormComponent): boolean | Promise<boolean> {
    return component.canLeave();
  }
}
