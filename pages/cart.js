import Cart from '@/components/Cart';
import Head from 'next/head';

export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Nidsscrochet</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Head>
      <Cart />
    </>
  );
}
