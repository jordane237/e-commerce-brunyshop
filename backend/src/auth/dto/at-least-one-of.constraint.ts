import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function AtLeastOneOf(...fields: string[]) {
  return function (object: Record<string, string | null>, propertyName: string) {
    return registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: [fields],
      options: { message: 'Un email ou un numéro de téléphone est requis.' },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedFields] = args.constraints;
          const obj = args.object as Record<string, string | null>;
          // Check that at least one of the related fields has a value
          const hasValue = relatedFields.some((field: string) => {
            const fieldValue = obj[field];
            return fieldValue != null && fieldValue !== '';
          });
          return hasValue;
        },
      },
    });
  };
}

@ValidatorConstraint({ name: 'atLeastOne', async: false })
export class AtLeastOneOfConstraint implements ValidatorConstraintInterface {
  private readonly relatedFields: string[];

  constructor(relatedFields: string[]) {
    this.relatedFields = relatedFields;
  }

  validate(value: unknown, args: ValidationArguments) {
    const obj = args.object as Record<string, string | null>;
    const hasValue = this.relatedFields.some((field: string) => {
      const fieldValue = obj[field];
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    });
    return hasValue;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Un email ou un numéro de téléphone est requis.';
  }
}
