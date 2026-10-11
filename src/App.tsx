import { Sidebar } from '@/components/sidebar';
import { MainArea } from '@/components/main-area';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <MainArea />
    </div>
  );
}
