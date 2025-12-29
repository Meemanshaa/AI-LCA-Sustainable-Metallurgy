import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { 
  Leaf, 
  Moon, 
  Sun, 
  Menu, 
  X,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import AuthModal from '@/components/AuthModal';

const Layout = () => {
  const location = useLocation();
  const { darkMode, toggleDarkMode, user, isAuthenticated, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const navigation = [
    { name: 'Home', href: '/', icon: Leaf },
    { name: 'Analysis', href: '/input', icon: null },
    { name: 'AI Suggestions', href: '/ai-suggestions', icon: null },
    { name: 'Results', href: '/results', icon: null },
    { name: 'Compare', href: '/compare', icon: null },
    { name: 'Report', href: '/report', icon: null },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 rounded-lg bg-eco-gradient"
              >
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </motion.div>
              <span className="font-bold text-xl text-foreground hidden sm:block">
                EcoLCA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="w-9 px-0"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* User menu */}
              {isAuthenticated && user ? (
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-9 px-0"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden md:flex"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden w-9 px-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border"
            >
              <div className="py-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile auth */}
                {isAuthenticated && user ? (
                  <div className="px-4 py-2 border-t border-border mt-4 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {user.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4"
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-5 w-5 text-primary" />
                <span className="font-semibold">EcoLCA Tool</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-driven Life Cycle Assessment for sustainable metallurgy and mining.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Hackathon Info</h3>
              <p className="text-sm text-muted-foreground">
                SIH25069 - Ministry of Mines
              </p>
              <p className="text-sm text-muted-foreground">
                Theme: Metallurgy
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Circular Economy</p>
                <p>Sustainable Mining</p>
                <p>LCA Methodology</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2025 EcoLCA Tool . Built by Team NeuraNova for Smart India Hackathon.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />
    </div>
  );
};

export default Layout;