export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  DELEGATE: 'Delegate',
  CHAIR: 'Chair',
  MEDIA: 'Press / Media',
  EXECUTIVE_BOARD: 'Executive Member',
  ADMIN: 'Administrator',
  SECURITY: 'Security',
  SECRETARY_GENERAL: 'Secretary General',
  DEPUTY_SECRETARY_GENERAL: 'Deputy Secretary General',
};

export function displayRole(role: string | undefined | null): string {
  if (!role) return 'Participant';
  return ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
