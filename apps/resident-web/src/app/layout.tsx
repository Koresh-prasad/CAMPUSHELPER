import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHMS Resident App - Apex Hostels',
  description: 'Smart Hostel Management System - Resident Companion',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  themeColor: '#2563eb'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white pb-20 sm:pb-0">
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative flex flex-col border-x border-slate-200">
          {children}
        </div>
      </body>
    </html>
  );
}
