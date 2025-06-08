import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isActivePath = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActivePath(path)
        ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
        : "text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
      isActivePath(path)
        ? "text-emerald-700 bg-emerald-100 border border-emerald-200"
        : "text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
    }`;

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-lg border-b border-gray-100 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent hover:from-emerald-700 hover:to-blue-700 transition-all duration-200"
            >
              📚 Tombo Tower
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/prompts" className={navLinkClass("/prompts")}>
                  Browse Prompts
                </Link>
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  Dashboard
                </Link>
                <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-600 hidden lg:block">
                      {user?.username}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/prompts" className={navLinkClass("/prompts")}>
                  Browse Prompts
                </Link>
                <Link to="/about" className={navLinkClass("/about")}>
                  About
                </Link>
                <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
                  <Link to="/login" className={navLinkClass("/login")}>
                    Log in
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/prompts"
                  className={mobileNavLinkClass("/prompts")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Prompts
                </Link>
                <Link
                  to="/dashboard"
                  className={mobileNavLinkClass("/dashboard")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user?.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/prompts"
                  className={mobileNavLinkClass("/prompts")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Browse Prompts
                </Link>
                <Link
                  to="/about"
                  className={mobileNavLinkClass("/about")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                  <Link
                    to="/login"
                    className={mobileNavLinkClass("/login")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/login"
                    className="block mx-4 px-6 py-3 text-center text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}