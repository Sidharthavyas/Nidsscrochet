import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [redirectPath, setRedirectPath] = useState('/');

  // Check if user was trying to checkout
  useEffect(() => {
    const checkoutIntent = localStorage.getItem('checkoutIntent');
    if (checkoutIntent === 'true') {
      setRedirectPath('/checkout');
      localStorage.removeItem('checkoutIntent');
    }
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push(redirectPath);
    }
  }, [isSignedIn, router, redirectPath]);

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Nidss Crochet</title>
        <meta name="description" content="Sign in to your account" />
      </Head>

      <div style={{ background: 'var(--cream)' }} className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="shadow-sm" style={{ background: 'var(--white)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold" style={{ 
                fontFamily: 'Pacifico, cursive',
                background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textDecoration: 'none'
              }}>
                <ShoppingBag className="w-6 h-6" style={{ color: 'var(--pink)' }} />
                Nidss Crochet
              </Link>
              
              <Link 
                href="/cart" 
                className="transition-colors"
                style={{ color: 'var(--pink)' }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Cart
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold" style={{ 
                fontFamily: 'Pacifico, cursive',
                background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#6b7280' }}>
                Or{' '}
                <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--pink)' }}>
                  create a new account
                </Link>
              </p>
              {redirectPath === '/checkout' && (
                <div className="mt-4 p-3 rounded-lg" style={{ 
                  background: 'var(--pink-soft)', 
                  border: '2px solid var(--pink)'
                }}>
                  <p className="text-sm" style={{ color: 'var(--pink-dark)' }}>
                    Please sign in to complete your checkout
                  </p>
                </div>
              )}
            </div>

            {/* Clerk SignIn Component */}
            <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10" style={{ background: 'var(--white)' }}>
              <SignIn 
                path="/login"
                routing="path"
                signUpUrl="/signup"
                redirectUrl={redirectPath}
                afterSignInUrl={redirectPath}
              />
            </div>

            {/* Benefits */}
            <div className="py-6 px-4 shadow sm:rounded-lg sm:px-10" style={{ background: 'var(--white)' }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: '#111827' }}>Why sign in?</h3>
              <ul className="space-y-3 text-sm" style={{ color: '#6b7280' }}>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'var(--pink)' }}>✓</span>
                  <span>Save your cart items for later</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'var(--pink)' }}>✓</span>
                  <span>Faster checkout process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'var(--pink)' }}>✓</span>
                  <span>Track your orders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5" style={{ color: 'var(--pink)' }}>✓</span>
                  <span>Save shipping addresses</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
