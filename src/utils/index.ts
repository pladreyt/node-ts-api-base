import { HashExpiredError } from '@exception/users/hash-expired.error';

export const checkHashIsExpired = ( dateExpiresAt: Date ): void => {
  if ( dateExpiresAt < new Date() ) {
    throw new HashExpiredError();
  }
};
