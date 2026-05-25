const EB_ROLES = ['EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL'] as const;
const CHAIR_ROLES = ['CHAIR', 'CO_CHAIR'] as const;

export function isExecutiveBoardRole(role?: string | null) {
  return !!role && EB_ROLES.includes(role as (typeof EB_ROLES)[number]);
}

export function isChairRole(role?: string | null) {
  return !!role && CHAIR_ROLES.includes(role as (typeof CHAIR_ROLES)[number]);
}

export function getAuthenticatedHomePath(role?: string | null) {
  if (isExecutiveBoardRole(role)) {
    return '/eb/dash';
  }

  if (isChairRole(role)) {
    return '/dashboard/chair';
  }

  if (role === 'DELEGATE') {
    return '/dashboard/delegate';
  }

  return '/dashboard';
}
