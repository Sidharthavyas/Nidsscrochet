// pages/sitemap.xml.js
// Enhanced dynamic sitemap with image sitemap support
import connectDB from '../lib/mongodb';
import Product from '../models/Product';
import Category from '../models/Category';

const SITE_URL = 'https://www.nidsscrochet.in';

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSiteMap(products, categories) {
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${SITE_URL}/rose.webp</image:loc>
      <image:title>Nidsscrochet - Handcrafted Crochet Creations</image:title>
      <image:caption>Premium handmade crochet products by Nidhi Tripathi in Mumbai</image:caption>
    </image:image>
  </url>

  <!-- Collections / Categories Section (hash links for SPA) -->
  <url>
    <loc>${SITE_URL}/#collections</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Individual Product Pages with Image Sitemaps -->
${products
      .map((product) => {
        const productImages = product.images && product.images.length > 0
          ? product.images
          : product.image ? [product.image] : [];

        const imageEntries = productImages
          .map(
            (img) => `    <image:image>
      <image:loc>${escapeXml(img)}</image:loc>
      <image:title>${escapeXml(product.name)} - Nidsscrochet</image:title>
      <image:caption>${escapeXml(product.description || product.name)}</image:caption>
    </image:image>`
          )
          .join('\n');

        return `  <url>
    <loc>${SITE_URL}/product/${product._id}</loc>
    <lastmod>${product.updatedAt || product.createdAt || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${imageEntries}
  </url>`;
      })
      .join('\n')}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  try {
    // ★ Connect to DB directly to avoid self-fetch deadlock
    await connectDB();

    // Fetch all products (select only needed fields for sitemap to be faster)
    // We get images, name, description, updatedAt, createdAt
    const products = await Product.find({}, 'name description image images updatedAt createdAt').lean();

    // If you had a Category model, you would fetch it here. 
    // Since we don't have a separate Category model file visible yet, we'll extract from products or skip.
    // For now, let's just use products.
    const categories = [];

    const sitemap = generateSiteMap(products, categories);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=43200, stale-while-revalidate=86400'
    );
    res.write(sitemap);
    res.end();

    return { props: {} };
  } catch (error) {
    console.error('Sitemap generation error:', error);

    // Fallback minimal sitemap
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.write(basicSitemap);
    res.end();

    return { props: {} };
  }
}

export default function Sitemap() {
  return null;
}