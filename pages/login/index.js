import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';
import Head from 'next/head';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    const checkoutIntent = localStorage.getItem('checkoutIntent');
    if (checkoutIntent === 'true') {
      setRedirectPath('/checkout');
      localStorage.removeItem('checkoutIntent');
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      router.push(redirectPath);
    }
  }, [isSignedIn, router, redirectPath]);

  if (isSignedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--pink-soft)',
            borderTop: '3px solid var(--pink)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--text-gray)' }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In - Nidss Crochet</title>
        <meta name="description" content="Sign in to your Nidss Crochet account" />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
      </Head>

      {/* Full page background */}
      <div style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.15), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,218,255,0.2), transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Navbar */}
        <header style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,107,157,0.1)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <div style={{
            maxWidth: '1400px', margin: '0 auto',
            padding: '0.9rem 2rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <Link href="/" style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'float 3s ease-in-out infinite'
            }}>
              <ShoppingBag style={{ width: '22px', height: '22px', color: 'var(--pink)', WebkitTextFillColor: 'var(--pink)' }} />
              Nidss Crochet
            </Link>

            <Link href="/cart" style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: 'var(--pink)', textDecoration: 'none',
              fontSize: '0.85rem', fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '50px',
              border: '2px solid var(--pink-soft)',
              background: 'var(--white)',
              transition: 'all 0.3s ease'
            }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back to Cart
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '3rem 1rem 4rem',
          minHeight: 'calc(100vh - 70px)',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          {/* Left Info Panel */}
          <div style={{
            width: '100%', maxWidth: '340px',
            animation: 'fadeInUp 0.5s ease both'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                fontFamily: 'Pacifico, cursive',
                fontSize: '2rem',
                background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem'
              }}>Welcome back! 🌸</h1>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Sign in to access your orders, saved addresses, and continue shopping.
              </p>
              {redirectPath === '/checkout' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--pink-soft), rgba(168,218,255,0.2))',
                  border: '1.5px solid var(--pink)',
                }}>
                  <p style={{ color: 'var(--pink-dark)', fontSize: '0.88rem', fontWeight: 600 }}>
                    🛒 Sign in to complete your checkout
                  </p>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div style={{
              background: 'var(--white)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid rgba(255,107,157,0.08)'
            }}>
              <p style={{ fontWeight: 700, color: 'var(--black)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Why sign in?
              </p>
              {[
                { icon: '🛒', text: 'Save your cart for later' },
                { icon: '⚡', text: 'Faster checkout process' },
                { icon: '📦', text: 'Track your orders easily' },
                { icon: '📍', text: 'Save shipping addresses' },
                { icon: '🎁', text: 'Exclusive offers & updates' },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255,107,157,0.06)'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <span style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clerk SignIn Component */}
          <div style={{
            width: '100%', maxWidth: '400px',
            animation: 'fadeInUp 0.5s ease 0.1s both'
          }}>
            <SignIn
              signUpUrl="/signup"
              fallbackRedirectUrl={redirectPath}
              forceRedirectUrl={redirectPath === '/checkout' ? '/checkout' : undefined}
            />
          </div>
        </main>
      </div>
    </>
  );
}
