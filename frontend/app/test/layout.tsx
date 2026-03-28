import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Online Assessment',
  description: 'Student assessment portal',
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
