import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Nav } from "./Nav";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Nav />
      <main className="w-full max-w-[1200px] mx-auto px-6 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
