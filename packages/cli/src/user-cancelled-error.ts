export class UserCancelledError extends Error {
  public readonly code = "USER_CANCELLED" as const;

  constructor(message = "Operation cancelled") {
    super(message);
    this.name = "UserCancelledError";
  }
}

export const isUserCancelled = (e: unknown): e is UserCancelledError =>
  e instanceof UserCancelledError;
