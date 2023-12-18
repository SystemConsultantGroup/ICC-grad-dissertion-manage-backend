import { UserType } from 'src/common/enums/user-type.enum';

export type Payload = {
  loginId: string;
  type: UserType;
};
