import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { JournalDataProvider } from "../context/JournalDataContext";

function AppLayout() {
  return (
    <JournalDataProvider>
      <div className="app-shell flex h-screen min-h-screen overflow-hidden">
        <Sidebar />

        <div className="ml-64 flex min-h-0 min-w-0 flex-1 flex-col max-md:ml-0">
          {/* Header tetap berada di atas */}
          <div className="sticky top-0 z-[100] shrink-0">
            <Header />
          </div>

          {/* Hanya area content yang melakukan scroll */}
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
            <div className="page-enter min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </JournalDataProvider>
  );
}

export default AppLayout;