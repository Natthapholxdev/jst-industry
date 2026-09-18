// lib/routes.ts

export const ROUTES = {
  // Public & General
  HOME: '/',
  LIVE: '/live',
  DEMO_UPLOAD: '/demo-upload',
  
  // Auth
  LOGIN: '/login',
  
  // Admin & Dashboard
  DASHBOARD: '/dashboard',
  ATTENDANCE: '/attendance',
  ATTENDANCE_PERSON: '/attendance-person',
  EMPLOYEES: '/employees',
  DEPARTMENTS: '/departments',
  LEAVES: '/leaves',
  OT_REPORTS: '/ot-reports',
  ADMIN_USERS: '/admin-users',
  ADMIN_LOGS: '/admin-logs',
  SETTINGS: '/settings',
  MANUAL: '/manual',
  
  // API Routes
  API: {
    ADMINS: '/api/admins',
    ATTENDANCE: '/api/attendance',
    AUTH: '/api/auth',
    AUTH_LOGOUT: '/api/auth/logout',
    DEPARTMENTS: '/api/departments',
    EMPLOYEES: '/api/employees',
    LEAVES: '/api/leaves',
    PRESENTATION: '/api/presentation',
    SETTINGS: '/api/settings',
    SHIFTS: '/api/shifts',
    UPLOAD: '/api/upload',
    UPLOAD_DEMO: '/api/upload-demo',
  }
} as const;

// Types helper if needed
export type AppRoutes = typeof ROUTES;
