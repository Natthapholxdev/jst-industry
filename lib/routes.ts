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

  // HRM — Human Resource Management
  PAYROLL: '/payroll',
  PAYSLIP: '/payslip',
  CONTRACTS: '/contracts',
  BENEFITS: '/benefits',

  // HRD — Human Resource Development
  PERFORMANCE: '/performance',
  TRAINING: '/training',

  // HROD — HR Org Development
  ORG_CHART: '/org-chart',
  WORKFORCE_PLAN: '/workforce-plan',
  
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
    PAYROLL: '/api/payroll',
    CONTRACTS: '/api/contracts',
    PERFORMANCE: '/api/performance',
    TRAINING: '/api/training',
  }
} as const;

// Types helper if needed
export type AppRoutes = typeof ROUTES;
