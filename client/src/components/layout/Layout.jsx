import Sidebar from './Sidebar';
import useAuthStore from '../../store/authStore';

export default function Layout({ children, readOnly = false }) {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {readOnly && (
          <div className="bg-warning-light border-b border-orange-200 px-6 py-2.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-warning">
              👁 Viewing as Builder Admin — Read only. You cannot modify any settings.
            </span>
          </div>
        )}
        <div key={user?.role || 'guest'} className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
