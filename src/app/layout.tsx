import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { WishlistProvider } from '@/lib/wishlist-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/modals/CartDrawer';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { RfqModal } from '@/components/modals/RfqModal';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`h-full ${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('amg_theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.style.colorScheme = 'light';
              }
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-[#0B0B0C] text-[#0B0B0C] dark:text-white font-sans antialiased selection:bg-[#C6F432] selection:text-[#0B0B0C]">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
