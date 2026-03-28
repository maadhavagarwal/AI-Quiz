import type { Metadata } from 'next';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'AI MCQ Maker - Intelligent Quiz Generation Platform',
  description: 'Generate high-quality multiple-choice questions using AI. Perfect for teachers and educators.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
