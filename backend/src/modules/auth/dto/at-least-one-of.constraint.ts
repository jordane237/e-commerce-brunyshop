import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

// Contrainte transversale : au moins un des champs listés doit être renseigné
// (AUT-01 : e-mail ou téléphone).
export function AtLeastOneOf(fields: string[], options?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object.constructor,
      propertyName,
      constraints: [fields],
      options,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const [relatedFields] = args.constraints as [string[]];
          const candidate = args.object as Record<string, unknown>;
          return relatedFields.some((field) => {
            const value = candidate[field];
            return value !== undefined && value !== null && value !== '';
          });
        },
        defaultMessage(): string {
          return 'Renseignez un e-mail ou un numéro de téléphone.';
        },
      },
    });
  };
}
