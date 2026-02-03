// pages/sitemap.xml.js
// Dynamic sitemap generation for SEO

const SITE_URL = 'https://www.nidsscrochet.in';

function generateSiteMap(products) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Product Pages -->
  ${products
      .map((product) => {
        return `
  <url>
    <loc>${SITE_URL}/product/${product._id}</loc>
    <lastmod>${product.updatedAt || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  try {
    // Fetch all products
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products`);
    const data = await response.json();

    const products = data.success ? data.data : [];

    // Generate the XML sitemap
    const sitemap = generateSiteMap(products);

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Sitemap generation error:', error);

    // Return basic sitemap if products fetch fails
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.write(basicSitemap);
    res.end();

    return {
      props: {},
    };
  }
}

// Default export required for Next.js page
export default function Sitemap() {
  // This component won't be rendered as getServerSideProps handles the response
  return null;
}
