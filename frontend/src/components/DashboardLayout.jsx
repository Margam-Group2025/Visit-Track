import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full p-6">
      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <span className="font-heading text-white text-sm font-bold">SF</span>
            </div>
            <span className="font-heading text-white text-lg">SiteFlow</span>
          </div>
          {/* Close button — mobile only */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="rounded-xl px-4 py-3 mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar — always visible md and up */}
      <aside className="hidden md:flex w-64 shrink-0" style={{ background: 'var(--text-h)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — slide-in drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-0 left-0 h-full w-64 z-50 md:hidden"
              style={{ background: 'var(--text-h)' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div
          className="px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-3"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          {/* Hamburger — mobile only */}
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[var(--text-h)] shrink-0">
            <Menu size={22} />
          </button>

          {Icon && (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-bg)' }}
            >
              <Icon size={18} style={{ color: 'var(--accent)' }} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-base sm:text-lg text-[var(--text-h)] truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">{subtitle}</p>}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-4xl mx-auto p-4 sm:p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;