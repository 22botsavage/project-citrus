import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Project Citrus - TV-01 Local Processing Prototype',
  description: 'Technical feasibility prototype for browser-local file processing and SHA-256 computation in Project Citrus.',
  openGraph: {
    title: 'Project Citrus - TV-01 Local Processing Prototype',
    description: 'Technical feasibility prototype for browser-local file processing and SHA-256 computation in Project Citrus.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Citrus - TV-01 Local Processing Prototype',
    description: 'Technical feasibility prototype for browser-local file processing and SHA-256 computation in Project Citrus.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
