import type { User } from '../context/AuthContext';

/** Mirrors server redirect logic for client-side navigation guards. */
export function getHomeRoute(user: User): string {
  if (user.isCredentialGenerated && !user.tempPasswordChanged) {
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

export function formatRoleLabel(role: User['role']): string {
  switch (role) {
    case 'citizen':
      return 'Citizen';
    case 'city_authority':
      return 'City Authority';
    case 'state_authority':
      return 'State Authority';
    default:
      return 'User';
  }
}
