import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useAuth } from "../contexts/AuthContext";

function RootComponent() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50">
      <header className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-gray-100 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                <Link to="/"> 📚 Tombo Tower</Link>
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                  <span className="text-sm text-gray-600 hidden md:block">
                    Welcome back, <span className="font-medium text-gray-800">{user?.username}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer></footer>
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
});
