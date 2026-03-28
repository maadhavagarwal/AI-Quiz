// Mobile bottom navigation component
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/quizzes', icon: '📚', label: 'Quizzes' },
    { href: '/quiz/new', icon: '➕', label: 'Create' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className="flex-1">
            <div
              className={`flex flex-col items-center justify-center py-3 ${
                isActive(item.href)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
