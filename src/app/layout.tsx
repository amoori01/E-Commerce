import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/modals/CartDrawer';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { RfqModal } from '@/components/modals/RfqModal';

export const metadata: Metadata = {
  title: 'AMG Holdings - Enterprise Multi-Subsidiary E-Commerce & RFQ Platform',
  description:
    'Digital procurement platform for AMG Holdings sister companies: Heavy Structural Engineering, Ethio Roofing, Commercial Transport, Industrial Gases, and Coffee.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-slate-50 font-sans">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <CheckoutModal />
              <RfqModal />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
