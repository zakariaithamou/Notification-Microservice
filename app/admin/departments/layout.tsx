"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, LogOut, Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    // Only redirect if there is no token AND we are not already on the login page
    if (!token && pathname !== "/admin/login") {
      router.replace("/admin/login");
    } else {
      // If they have a token, or they are on the login page, stop loading
      const timeoutId = window.setTimeout(() => {
        setIsLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  // Do not render the dashboard UI if they are on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900">Admin Portal</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            href="/admin/departments"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.includes("/admin/departments")
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            Departments
          </Link>
          {/* You can add more sidebar links here later */}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
