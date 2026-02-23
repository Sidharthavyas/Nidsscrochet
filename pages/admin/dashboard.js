import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProtectedRoute from '../../components/ProtectedRoute';
import styles from '../../styles/Admin.module.css';

function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Banner state
  const [bannerText, setBannerText] = useState('');
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState('all');

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);


  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '0',
    featured: false,
    shipping_charges: '0',
    cod_available: false,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: '🎨',
    order: 0,
  });

  // NEW: Changed to array for multiple images
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('products');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        if (data.data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: data.data[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [formData.category]);

  const fetchBanner = useCallback(async () => {
    try {
      const response = await fetch('/api/banner');
      const data = await response.json();
      if (data.success && data.data) {
        setBannerText(data.data.text || '');
        setBannerActive(data.data.active || false);
      }
    } catch (error) {
      console.error('Error fetching banner:', error);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/orders?status=${ordersFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersFilter]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Revalidate homepage after product changes
  const triggerRevalidation = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Revalidation failed (non-critical):', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
        setMessage({ type: 'success', text: '✓ Order status updated!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBanner();
  }, [fetchProducts, fetchCategories, fetchBanner]);

  // Fetch orders when Orders tab is active or filter changes
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  // Fetch users when Users tab is active
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: name === 'order' ? parseInt(value) : value,
    });
  };

  // NEW: Handle multiple image selection (max 5)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images allowed' });
      return;
    }

    setImageFiles(files);

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // NEW: Remove image from selection
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // NEW: Start editing a product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      category: product.category,
      name: product.name,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || '',
      stock: product.stock.toString(),
      featured: product.featured,
      shipping_charges: (product.shipping_charges || 0).toString(),
      cod_available: !!product.cod_available,
    });
    setImagePreviews(product.images || [product.image]);
    setImageFiles([]);
    setDrawerOpen(true);
  };

  // NEW: Cancel editing
  const cancelEdit = () => {
    setEditingProduct(null);
    resetForm();
    setDrawerOpen(false);
  };

  const resetForm = () => {
    setFormData({
      category: categories[0]?.name || '',
      name: '',
      description: '',
      price: '',
      salePrice: '',
      stock: '0',
      featured: false,
      shipping_charges: '0',
      cod_available: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setDrawerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if adding new product or editing with existing images
    if (!editingProduct && imageFiles.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one image' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();

      formDataToSend.append('category', formData.category);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('salePrice', formData.salePrice || '');
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('featured', formData.featured);
      formDataToSend.append('shipping_charges', formData.shipping_charges || '0');
      formDataToSend.append('cod_available', formData.cod_available);

      // NEW: Append multiple images
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      // NEW: If editing, add product ID and existing images
      if (editingProduct) {
        formDataToSend.append('id', editingProduct._id);
        // Keep existing images that weren't replaced
        const existingImages = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http'));
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      const url = editingProduct ? '/api/products' : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✓ Product ${editingProduct ? 'updated' : 'added'} successfully!`
        });

        resetForm();
        setEditingProduct(null);
        fetchProducts();
        triggerRevalidation();

        setTimeout(() => {
          setDrawerOpen(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error processing request' });
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✓ Category added successfully!' });
        setCategoryFormData({ name: '', icon: '🎨', order: 0 });
        fetchCategories();

        setTimeout(() => {
          setShowCategoryForm(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to add category' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding category' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/products?id=${id}&permanent=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✓ Product deleted successfully' });
        fetchProducts();
        triggerRevalidation();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting product' });
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category? Products in this category will remain but category will be removed.')) return;

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✓ Category deleted successfully' });
        fetchCategories();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting category' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin');
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setBannerLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/banner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: bannerText,
          active: bannerActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '✓ Banner updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update banner' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating banner' });
    } finally {
      setBannerLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard - nidsscrochet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className={styles.headerBrand}
            >
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>nidsscrochet</h1>
              <span className={styles.adminBadge}>📦 Admin</span>
            </motion.div>
            <div className={styles.headerActions}>
              <motion.button
                onClick={handleLogout}
                className={styles.logoutBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </div>
        </header>

        <div className={styles.dashboardContainer}>
          {message.text && (
            <motion.div
              className={`${styles.message} ${styles[message.type]}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.text}
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <motion.button
              className={`${styles.tabBtn} ${activeTab === 'products' ? styles.active : ''}`}
              onClick={() => setActiveTab('products')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🛍️ Products
            </motion.button>
            <motion.button
              className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.active : ''}`}
              onClick={() => setActiveTab('categories')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📁 Categories
            </motion.button>
            <motion.button
              className={`${styles.tabBtn} ${activeTab === 'banner' ? styles.active : ''}`}
              onClick={() => setActiveTab('banner')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎉 Banner
            </motion.button>
            <motion.button
              className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.active : ''}`}
              onClick={() => setActiveTab('orders')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📋 Orders
            </motion.button>
            <motion.button
              className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              👥 Users
            </motion.button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              <div className={styles.sectionActions}>
                <div className={styles.searchBar}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products by name..."
                    className={styles.searchInput}
                  />
                  <span className={styles.searchIcon}>🔍</span>
                </div>

                <motion.button
                  onClick={() => {
                    if (drawerOpen && editingProduct) {
                      cancelEdit();
                      setDrawerOpen(false);
                    } else {
                      setDrawerOpen(!drawerOpen);
                      if (!drawerOpen) {
                        setEditingProduct(null);
                        resetForm();
                      }
                    }
                  }}
                  className={styles.addBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {drawerOpen ? '✕ Close' : '+ Add Product'}
                </motion.button>
              </div>

              {drawerOpen && (
                <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
                  <motion.div
                    className={styles.drawerPanel}
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.drawerHeader}>
                      <h2>{editingProduct ? '✏️ Edit Product' : 'Add New Product'}</h2>
                      <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.productForm}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Category *</label>
                          <select name="category" value={formData.category} onChange={handleInputChange} required>
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                              <option key={cat._id} value={cat.name}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.formGroup}>
                          <label>Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g., Crochet Rose Bouquet"
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Description *</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your product..."
                          rows="3"
                          required
                        />
                      </div>


                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Price (₹) *</label>
                          <input
                            type="text"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="₹299"
                            required
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Sale Price (₹)</label>
                          <input
                            type="text"
                            name="salePrice"
                            value={formData.salePrice}
                            onChange={handleInputChange}
                            placeholder="₹199 (optional)"
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Stock</label>
                          <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Shipping Charges (₹)</label>
                          <input
                            type="number"
                            name="shipping_charges"
                            value={formData.shipping_charges}
                            onChange={handleInputChange}
                            min="0"
                            placeholder="0 = Free Shipping"
                          />
                          <small>Set to 0 for free shipping</small>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              name="cod_available"
                              checked={formData.cod_available}
                              onChange={handleInputChange}
                            />
                            <span>📦 Cash on Delivery Available</span>
                          </label>
                        </div>

                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                          />
                          <span>⭐ Featured Product</span>
                        </label>
                      </div>

                      {/* NEW: Multiple Image Upload */}
                      <div className={styles.formGroup}>
                        <label>Product Images * (Max 5)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          required={!editingProduct && imagePreviews.length === 0}
                        />
                        <small>Upload up to 5 images for your product</small>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                          <div className={styles.imagePreviewGrid}>
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className={styles.imagePreviewItem}>
                                <Image
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  width={150}
                                  height={150}
                                  style={{ objectFit: 'cover' }}
                                  unoptimized
                                />
                                <button
                                  type="button"
                                  className={styles.removeImageBtn}
                                  onClick={() => removeImage(index)}
                                >
                                  ✕
                                </button>
                                {index === 0 && (
                                  <span className={styles.primaryBadge}>Primary</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={styles.formActions}>
                        <motion.button
                          type="submit"
                          className={styles.submitBtn}
                          disabled={uploading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {uploading ? '⏳ Processing...' : editingProduct ? '✓ Update Product' : '✓ Add Product'}
                        </motion.button>

                        {editingProduct && (
                          <motion.button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={cancelEdit}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              <div className={styles.productsSection}>
                <h2>All Products ({filteredProducts.length || products.length})</h2>

                {loading ? (
                  <div className={styles.loading}>🧶 Loading products...</div>
                ) : products.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No products yet. Add your first product!</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No products match that search. Try another name.</p>
                  </div>
                ) : (
                  <div className={styles.productsGrid}>
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product._id}
                        className={styles.productItem}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={styles.productImage}>
                          <Image
                            src={product.images?.[0] || product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 320px"
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                          <div className={styles.cardOverlay}>
                            <motion.button
                              onClick={() => handleEdit(product)}
                              className={styles.cardIconBtn}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              ✏️
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(product._id)}
                              className={`${styles.cardIconBtn} ${styles.deleteGhost}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              🗑️
                            </motion.button>
                          </div>
                          {product.featured && (
                            <span className={styles.featuredBadge}>⭐ Featured</span>
                          )}
                          {/* Show image count if multiple */}
                          {product.images && product.images.length > 1 && (
                            <span className={styles.imageCountBadge}>
                              📸 {product.images.length}
                            </span>
                          )}
                        </div>
                        <div className={styles.productDetails}>
                          <span className={styles.productCategory}>{product.category}</span>
                          <h3>{product.name}</h3>
                          <p>{product.description}</p>
                          <div className={styles.productMeta}>
                            {product.salePrice ? (
                              <span className={styles.price}>
                                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9em', marginRight: '0.5rem' }}>
                                  {product.price}
                                </span>
                                <span style={{ color: '#e91e63', fontWeight: 'bold' }}>
                                  {product.salePrice}
                                </span>
                                <span style={{ background: '#e91e63', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', marginLeft: '0.5rem' }}>
                                  {Math.round(((parseFloat(product.price.replace(/[^\d.]/g, '')) - parseFloat(product.salePrice.replace(/[^\d.]/g, ''))) / parseFloat(product.price.replace(/[^\d.]/g, ''))) * 100)}% OFF
                                </span>
                              </span>
                            ) : (
                              <span className={styles.price}>{product.price}</span>
                            )}
                            <span className={styles.stock}>Stock: {product.stock}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            {product.shipping_charges > 0 ? (
                              <span style={{ fontSize: '0.7em', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>🚚 ₹{product.shipping_charges}</span>
                            ) : (
                              <span style={{ fontSize: '0.7em', background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px' }}>🚚 Free</span>
                            )}
                            {product.cod_available && (
                              <span style={{ fontSize: '0.7em', background: '#ede9fe', color: '#5b21b6', padding: '2px 6px', borderRadius: '4px' }}>📦 COD</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <>
              <div className={styles.sectionActions}>
                <motion.button
                  onClick={() => setShowCategoryForm(!showCategoryForm)}
                  className={styles.addBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showCategoryForm ? '✕ Close' : '+ Add Category'}
                </motion.button>
              </div>

              {showCategoryForm && (
                <motion.div
                  className={styles.formCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2>Add New Category</h2>
                  <form onSubmit={handleCategorySubmit} className={styles.categoryForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Category Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={categoryFormData.name}
                          onChange={handleCategoryInputChange}
                          placeholder="e.g., Flowers"
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Icon (Emoji) *</label>
                        <input
                          type="text"
                          name="icon"
                          value={categoryFormData.icon}
                          onChange={handleCategoryInputChange}
                          placeholder="🌸"
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Display Order</label>
                      <input
                        type="number"
                        name="order"
                        value={categoryFormData.order}
                        onChange={handleCategoryInputChange}
                        min="0"
                        placeholder="0"
                      />
                      <small>Lower numbers appear first</small>
                    </div>

                    <motion.button
                      type="submit"
                      className={styles.submitBtn}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ✓ Add Category
                    </motion.button>
                  </form>
                </motion.div>
              )}

              <div className={styles.categoriesSection}>
                <h2>All Categories ({categories.length})</h2>

                {categories.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No categories yet. Add your first category!</p>
                  </div>
                ) : (
                  <div className={styles.categoriesGrid}>
                    {categories.map((category, index) => (
                      <motion.div
                        key={category._id}
                        className={styles.categoryItem}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={styles.categoryIcon}>{category.icon}</div>
                        <div className={styles.categoryInfo}>
                          <h3>{category.name}</h3>
                          <p>Order: {category.order}</p>
                          <p className={styles.categorySlug}>/{category.slug}</p>
                        </div>
                        <div className={styles.categoryActions}>
                          <motion.button
                            onClick={() => handleDeleteCategory(category._id)}
                            className={styles.deleteBtnSmall}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Banner Tab */}
          {activeTab === 'banner' && (
            <div className={styles.bannerSection}>
              <motion.div
                className={styles.bannerFormCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2>📢 Manage Sales Banner</h2>
                <form onSubmit={handleBannerSubmit} className={styles.bannerForm}>
                  <div className={styles.formGroup}>
                    <label>Banner Text</label>
                    <textarea
                      className={styles.bannerTextarea}
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="🎉 Sale! 50% off on all products! Limited time offer! 🎉"
                      maxLength={500}
                    />
                    <div className={`${styles.charCount} ${bannerText.length > 400 ? (bannerText.length > 480 ? styles.error : styles.warning) : ''}`}>
                      {bannerText.length}/500 characters
                    </div>
                  </div>

                  <div className={styles.toggleContainer}>
                    <span className={styles.toggleLabel}>Banner Active:</span>
                    <div
                      className={`${styles.toggleSwitch} ${bannerActive ? styles.active : ''}`}
                      onClick={() => setBannerActive(!bannerActive)}
                    >
                      <div className={styles.toggleKnob}></div>
                    </div>
                    <span>{bannerActive ? '✅ Visible on site' : '❌ Hidden'}</span>
                  </div>

                  {bannerText && (
                    <div className={styles.bannerPreview}>
                      <div className={styles.bannerPreviewLabel}>📺 Preview:</div>
                      <div className={styles.bannerPreviewText}>
                        {bannerText} &nbsp;&nbsp;&nbsp; {bannerText} &nbsp;&nbsp;&nbsp; {bannerText}
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={bannerLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {bannerLoading ? '⏳ Saving...' : '✓ Save Banner'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className={styles.sectionActions}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['all', 'pending', 'processing', 'shipped', 'delivered', 'paid', 'cancelled'].map(status => (
                    <motion.button
                      key={status}
                      className={`${styles.tabBtn} ${ordersFilter === status ? styles.active : ''}`}
                      onClick={() => setOrdersFilter(status)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                    >
                      {status === 'all' ? '📋 All' : status === 'pending' ? '⏳ Pending' : status === 'processing' ? '⚙️ Processing' : status === 'shipped' ? '🚚 Shipped' : status === 'delivered' ? '✅ Delivered' : status === 'paid' ? '💰 Paid' : '❌ Cancelled'}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  onClick={fetchOrders}
                  className={styles.addBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontSize: '0.85rem' }}
                >
                  🔄 Refresh
                </motion.button>
              </div>

              {ordersLoading ? (
                <div className={styles.loading}>📋 Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No orders found{ordersFilter !== 'all' ? ` with status "${ordersFilter}"` : ''}.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {orders.map((order, index) => (
                    <motion.div
                      key={order._id}
                      className={styles.formCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ padding: '1.2rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: '#1a1a2e' }}>
                            {order.paymentMethod === 'cod' ? '📦' : '💳'} Order #{order.orderId?.slice(0, 20) || order._id?.slice(-8)}
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: '#999' }}>
                            {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px', fontWeight: 600,
                            background: order.paymentMethod === 'cod' ? '#fef3c7' : '#d1fae5',
                            color: order.paymentMethod === 'cod' ? '#92400e' : '#065f46',
                          }}>
                            {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            style={{
                              fontSize: '0.8rem', padding: '4px 8px', borderRadius: '8px', fontWeight: 600,
                              border: '1.5px solid rgba(255,107,157,0.2)', background: 'var(--cream, #fff9f0)',
                              cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="created">🆕 Created</option>
                            <option value="paid">💰 Paid</option>
                            <option value="processing">⚙️ Processing</option>
                            <option value="shipped">🚚 Shipped</option>
                            <option value="delivered">✅ Delivered</option>
                            <option value="cancelled">❌ Cancelled</option>
                            <option value="failed">🔴 Failed</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div style={{ background: 'rgba(255,107,157,0.04)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          👤 {order.customer?.name || 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#666' }}>📧 {order.customer?.email || 'N/A'}</p>
                        <p style={{ fontSize: '0.78rem', color: '#666' }}>📱 {order.customer?.phone || 'N/A'}</p>
                        <p style={{ fontSize: '0.78rem', color: '#666' }}>📍 {order.customer?.address || 'N/A'}</p>
                        {order.customer?.notes && <p style={{ fontSize: '0.78rem', color: '#666', fontStyle: 'italic' }}>📝 {order.customer.notes}</p>}
                      </div>

                      {/* Items */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', borderBottom: idx < order.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                              {item.image && (
                                <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              )}
                              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500 }}>{item.name}</span>
                              <span style={{ fontSize: '0.78rem', color: '#666' }}>x{item.quantity}</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1.5px solid rgba(255,107,157,0.1)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a1a2e' }}>Total</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e91e63' }}>₹{order.amount}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className={styles.sectionActions}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>👥 Registered Users ({users.length})</h2>
                <motion.button
                  onClick={fetchUsers}
                  className={styles.addBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ fontSize: '0.85rem' }}
                >
                  🔄 Refresh
                </motion.button>
              </div>

              {usersLoading ? (
                <div className={styles.loading}>👥 Loading users...</div>
              ) : users.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No registered users found.</p>
                </div>
              ) : (
                <div className={styles.categoriesGrid} style={{ marginTop: '1rem' }}>
                  {users.map((usr, index) => (
                    <motion.div
                      key={usr.id}
                      className={styles.categoryItem}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                        {usr.imageUrl ? (
                          <img src={usr.imageUrl} alt={usr.firstName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b9d, #c44569)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                            {(usr.firstName?.[0] || usr.email?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                            {usr.firstName} {usr.lastName}
                          </h3>
                          <p style={{ fontSize: '0.78rem', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {usr.email}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: '#999', margin: '2px 0 0' }}>
                            Joined {new Date(usr.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProtectedAdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}