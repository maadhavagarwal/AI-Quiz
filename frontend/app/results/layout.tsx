import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Assessment Result',
  description: 'Student result portal',
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
