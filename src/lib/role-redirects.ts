export const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  institution_admin: '/admin/dashboard',
  principal: '/admin/dashboard',
  hod: '/admin/dashboard',
  hr_manager: '/admin/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard',
  accountant: '/admin/fees',
  librarian: '/admin/library',
  hostel_warden: '/admin/hostel',
  transport_manager: '/admin/transport',
};

export function getRedirectPath(roleName: string): string {
  return ROLE_REDIRECTS[roleName] || '/dashboard';
}