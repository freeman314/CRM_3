import type { RouteObject } from 'react-router-dom'
import { LoginPage } from './screens/LoginPage.tsx'
import { DashboardPage } from './screens/DashboardPage.tsx'
import { ClientsListPage } from './screens/ClientsListPage.tsx'
import { ProtectedLayout } from './shared/ProtectedLayout.tsx'
import { ClientViewPage } from './screens/ClientViewPage.tsx'
import { CreateClientPage } from './screens/CreateClientPage.tsx'
import { TasksListPage } from './screens/TasksListPage.tsx'
import { StatusesPage } from './screens/StatusesPage.tsx'
import { CategoriesPage } from './screens/CategoriesPage.tsx'
import { CitiesPage } from './screens/CitiesPage.tsx'
import { ChangePasswordPage } from './screens/ChangePasswordPage.tsx'
import { UsersAdminPage } from './screens/UsersAdminPage.tsx'
import { AuditLogsPage } from './screens/AuditLogsPage.tsx'
import { CalendarPage } from './screens/CalendarPage.tsx'
import { ReportsPage } from './screens/ReportsPage.tsx'
import { EditClientPage } from './screens/EditClientPage.tsx'
import { RootProviders } from './RootProviders.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootProviders />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'clients', element: <ClientsListPage /> },
          { path: 'clients/create', element: <CreateClientPage /> },
          { path: 'clients/:id', element: <ClientViewPage /> },
          { path: 'clients/:id/edit', element: <EditClientPage /> },
          { path: 'tasks', element: <TasksListPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'directories/statuses', element: <StatusesPage /> },
          { path: 'directories/categories', element: <CategoriesPage /> },
          { path: 'directories/cities', element: <CitiesPage /> },
          { path: 'profile/change-password', element: <ChangePasswordPage /> },
          { path: 'admin/users', element: <UsersAdminPage /> },
          { path: 'admin/audit', element: <AuditLogsPage /> },
        ],
      },
    ],
  },
]


