import { Sidebar } from '@/features/sidebar';
import { MainArea } from '@/features/main-area';
import { TopBar } from '@/features/topbar';
import { ToastProvider, ToastContainer } from '@/components/toasts';
import { ThemeProvider, SidebarProvider } from '@/context';

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
              <TopBar />
              <MainArea />
            </div>
          </div>
          <ToastContainer />
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
