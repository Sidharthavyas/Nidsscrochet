import Cart from '@/components/Cart';
import Head from 'next/head';
import Navbar from '@/components/Navbar';

export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Nidsscrochet</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Head>
      <Navbar />
      <Cart />
    </>
  );
}
