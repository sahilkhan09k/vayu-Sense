/** Returns the frontend path a user should land on after auth actions. */
export function getRedirectPath(user: {
  role: string;
  isCredentialGenerated?: boolean;
  tempPasswordChanged?: boolean;
}): string {
  if (user.isCredentialGenerated && user.tempPasswordChanged === false) {
    return '/change-password';
  }

  switch (user.role) {
    case 'citizen':
      return '/citizen';
    case 'city_authority':
    case 'state_authority':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
