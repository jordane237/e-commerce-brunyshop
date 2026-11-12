import { BadRequestException, type ValidationError } from '@nestjs/common';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// Flattens nested class-validator errors into `items.0.unitPrice` style
// paths so the client can point to the exact offending field.
export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): ValidationErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent === '' ? error.property : `${parent}.${error.property}`;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    const children =
      error.children && error.children.length > 0
        ? flattenValidationErrors(error.children, field)
        : [];
    return [...own, ...children];
  });
}

// ValidationPipe factory used by main.ts and the e2e bootstrap (TEC-04):
// any DTO violation (including a forbidden field such as `unitPrice`) is a
// 400 with the stable business code VALIDATION_ERROR. The payload keeps the
// ValidationError shape so AllExceptionsFilter still exposes
// `errors: [{ field, message }]`.
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const details = flattenValidationErrors(errors);
  const message =
    details.length > 0
      ? details.map((detail) => ({
          property: detail.field,
          constraints: { validation: detail.message },
        }))
      : [{ property: '_', constraints: { validation: 'Requête invalide.' } }];
  return new BadRequestException({ code: 'VALIDATION_ERROR', message });
}
