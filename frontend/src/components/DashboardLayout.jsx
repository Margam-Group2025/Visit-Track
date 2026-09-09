import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const roleLabels = {
  sto: 'STO',
  technical: 'Technical',
  operation: 'Operation',
  admin: 'Admin',
  crm: 'CRM',
};

const DashboardLayout = ({ title, subtitle, icon: Icon, children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 flex flex-col justify-between p-6"
        style={{ background: 'var(--text-h)' }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <span className="font-heading text-white text-sm font-bold">SF</span>
            </div>
            <span className="font-heading text-white text-lg">SiteFlow</span>
          </div>

          <div
            className="rounded-xl px-4 py-3 mb-2"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
              {roleLabels[user?.role]} Department
            </p>
            <p className="text-white text-sm font-medium mt-0.5">{user?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg transition"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div
          className="px-8 py-6 flex items-center gap-3"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          {Icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-bg)' }}
            >
              <Icon size={19} style={{ color: 'var(--accent)' }} />
            </div>
          )}
          <div>
            <h1 className="font-heading text-lg text-[var(--text-h)]">{title}</h1>
            {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;