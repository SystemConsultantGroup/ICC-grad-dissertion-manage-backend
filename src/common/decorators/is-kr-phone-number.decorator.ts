import { registerDecorator, ValidationOptions } from "class-validator";

export function IsKoreanPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "IsKoreanPhoneNumber",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          const re = /^(\d{3})-(\d{4})-(\d{4})$/;
          return re.test(value);
        },
        defaultMessage() {
          return "전화번호는 000-0000-0000 형식이어야 합니다.";
        },
      },
    });
  };
}
