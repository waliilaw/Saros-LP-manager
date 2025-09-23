import { PositionProvider } from '@/context/PositionContext';
import '../globals.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="h-full bg-gray-50">
            <head>
                <title>Saros LP Manager</title>
                <meta name="description" content="Manage your Saros DLMM liquidity positions" />
            </head>
            <body className="h-full antialiased">
                <div className="min-h-full">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 pb-32">
                        <header className="py-10">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    Saros LP Manager
                                </h1>
                            </div>
                        </header>
                    </div>

                    <main className="-mt-32">
                        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                            <PositionProvider>
                                {children}
                            </PositionProvider>
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
