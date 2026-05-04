import {
  Outlet,
  RootRoute,
  Route,
  Router,
  RouterProvider,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { tokenStorage } from '@shared/lib'
import { useSession } from '@entities/session'
import { AppLayout } from '@widgets/layout/app-layout'
import { LoginPage } from '@pages/login/login-page'
import { SetupPage } from '@pages/setup/setup-page'
import { DashboardPage } from '@pages/dashboard/dashboard-page'
import { LinksPage } from '@pages/links/links-page'
import { LinkDetailPage } from '@pages/link-detail/link-detail-page'
import { AppsPage } from '@pages/apps/apps-page'
import { UsersPage } from '@pages/users/users-page'
import { EventsPage } from '@pages/events/events-page'
import { NotFoundPage } from '@pages/not-found/not-found-page'

const rootRoute = new RootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
})

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    if (tokenStorage.getAccess()) throw redirect({ to: '/' })
  },
})

const setupRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/setup',
  component: SetupPage,
  beforeLoad: () => {
    if (tokenStorage.getAccess()) throw redirect({ to: '/' })
  },
})

const protectedRoute = new Route({
  getParentRoute: () => rootRoute,
  id: 'protected',
  beforeLoad: () => {
    if (!tokenStorage.getAccess()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})

const dashboardRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
})

const linksRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/links',
  component: LinksPage,
})

const linkDetailRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/links/$shortCode',
  component: LinkDetailPage,
})

const appsRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/apps',
  component: AppsPage,
})

const eventsRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/events',
  component: EventsPage,
})

const usersRoute = new Route({
  getParentRoute: () => protectedRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: () => {
    const user = useSession.getState().user
    if (!user || user.role !== 'super_admin') {
      throw redirect({ to: '/' })
    }
  },
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  setupRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    linksRoute,
    linkDetailRoute,
    appsRoute,
    eventsRoute,
    usersRoute,
  ]),
])

export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouter() {
  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <TanStackRouterDevtools router={router} position="bottom-right" />}
    </>
  )
}
