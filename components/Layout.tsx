import type { ReactNode } from "react";
import Nav from "./Nav";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-8 sm:px-8">{children}</main>
    </div>
  );
}
