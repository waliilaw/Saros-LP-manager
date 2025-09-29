import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
              {children}
        </ClientLayout>
      </body>
    </html>
  );
}