import 'package:flutter/material.dart';
import 'screens/catalog_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/quotes_screen.dart';
import 'services/biometric_service.dart';

void main() {
  runApp(const AmgHoldingsApp());
}

class AmgHoldingsApp extends StatelessWidget {
  const AmgHoldingsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AMG Holdings Industrial E-Commerce',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E2B58), // AMG Corporate Navy
          primary: const Color(0xFF1E2B58),
          secondary: const Color(0xFF971E21), // AMG Heritage Crimson
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E2B58),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedIndex = 0;
  bool _isAuthenticated = true;
  final _biometricService = BiometricService();

  final List<Widget> _screens = const [
    CatalogScreen(),
    CartScreen(),
    QuotesScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Catalog',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart),
            label: 'Cart',
          ),
          NavigationDestination(
            icon: Icon(Icons.request_quote_outlined),
            selectedIcon: Icon(Icons.request_quote),
            label: 'Inquiries',
          ),
        ],
      ),
    );
  }
}
