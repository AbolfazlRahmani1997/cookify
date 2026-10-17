import { Outlet, useLocation } from "react-router-dom";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { ToastViewport } from "@/components/common/ToastViewport";

export function MarketingLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />
      <main key={location.pathname} className="page-in flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastViewport />
    </div>
  );
}
