import { Sidebar } from '@/components/sidebar';
import { MainArea } from '@/features/main-area';
import { TopBar } from '@/features/topbar';
import { ToastProvider, ToastContainer } from '@/components/toasts';

export default function App() {
  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <TopBar />
          <MainArea />
        </div>
      </div>
      <ToastContainer />
    </ToastProvider>
  );
}
