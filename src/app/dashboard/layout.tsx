import { PositionProvider } from '@/context/PositionContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PositionProvider>
            {children}
        </PositionProvider>
    );
}
