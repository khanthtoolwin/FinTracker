import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FinTrackerLogo } from './FinTrackerLogo';
import type { NavSection } from '../types/expense';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isSupabaseConfigured: boolean;
  userEmail: string | null;
  onSignOut: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ledger', label: 'Daily Expenses', icon: BookOpen },
  { id: 'analytics', label: 'Monthly Analytics', icon: BarChart3 },
  { id: 'setup', label: 'Setup & Export', icon: Settings2 },
];

function SidebarContent({
  activeSection,
  onSelectSection,
  onCloseMobile,
  isSupabaseConfigured,
  userEmail,
  onSignOut,
}: Omit<SidebarProps, 'mobileOpen'>) {
  return (
    <div className="flex h-full flex-col justify-between bg-[#0F1419] px-4 py-6">
      <div>
        <div className="flex items-center justify-between px-2 pb-6">
          <button
            type="button"
            onClick={() => {
              onSelectSection('overview');
              onCloseMobile();
            }}
            className="whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] rounded"
            aria-label="FinTracker home"
          >
            <FinTrackerLogo size="sm" />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] ${
                  isActive
                    ? 'bg-[#1A2129] text-[#34D399] font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#13181D] hover:text-[#F1F5F9]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#222A32] pt-4 px-2">
        {isSupabaseConfigured && userEmail ? (
          <div className="space-y-2.5">
            <div>
              <p className="text-xs font-medium text-[#7C8896]">Signed in</p>
              <p
                className="text-xs font-medium text-[#F1F5F9] truncate mt-0.5"
                title={userEmail}
              >
                {userEmail}
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#F1F5F9] bg-[#13181D] border border-[#222A32] rounded-md hover:bg-[#1A2129] hover:border-[#2E3944] transition-colors whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#F1F5F9]">Local Browser Mode</p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Entries are saved locally in this browser.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectSection('setup');
                onCloseMobile();
              }}
              className="text-xs font-medium text-[#34D399] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] rounded"
            >
              Backups &amp; Storage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  isSupabaseConfigured,
  userEmail,
  onSignOut,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 border-r border-[#222A32] bg-[#0F1419] sticky top-0 h-screen">
        <SidebarContent
          activeSection={activeSection}
          onSelectSection={onSelectSection}
          onCloseMobile={onCloseMobile}
          isSupabaseConfigured={isSupabaseConfigured}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-64 border-r border-[#222A32] bg-[#0F1419] shadow-xl z-50"
            >
              <SidebarContent
                activeSection={activeSection}
                onSelectSection={onSelectSection}
                onCloseMobile={onCloseMobile}
                isSupabaseConfigured={isSupabaseConfigured}
                userEmail={userEmail}
                onSignOut={onSignOut}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
