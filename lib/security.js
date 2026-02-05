// lib/security.js - Security utilities for input sanitization and validation
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Untrusted HTML string
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (dirty) => {
    if (!dirty || typeof dirty !== 'string') return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [],
    });
};

/**
 * Escape special characters to prevent injection
 * @param {string} input - User input
 * @returns {string} - Escaped string
 */
export const escapeInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    return validator.escape(input);
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    return validator.isEmail(email);
};

/**
 * Validate URL format
 * @param {string} url - URL string
 * @returns {boolean} - True if valid
 */
export const isValidURL = (url) => {
    if (!url) return false;
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true,
    });
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - MongoDB ID
 * @returns {boolean} - True if valid
 */
export const isValidMongoId = (id) => {
    if (!id) return false;
    return validator.isMongoId(id);
};

/**
 * Sanitize and validate product data
 * @param {object} data - Product data from form
 * @returns {object} - { valid: boolean, data: object, errors: array }
 */
export const validateProductData = (data) => {
    const errors = [];
    const sanitized = {};

    // Validate category
    if (!data.category || data.category.trim().length === 0) {
        errors.push('Category is required');
    } else {
        sanitized.category = sanitizeHTML(data.category.trim());
        if (sanitized.category.length > 50) {
            errors.push('Category cannot exceed 50 characters');
        }
    }

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
        errors.push('Product name is required');
    } else {
        sanitized.name = sanitizeHTML(data.name.trim());
        if (sanitized.name.length > 100) {
            errors.push('Name cannot exceed 100 characters');
        }
    }

    // Validate description
    if (!data.description || data.description.trim().length === 0) {
        errors.push('Description is required');
    } else {
        sanitized.description = sanitizeHTML(data.description.trim());
        if (sanitized.description.length > 500) {
            errors.push('Description cannot exceed 500 characters');
        }
    }

    // Validate price
    if (!data.price || data.price.trim().length === 0) {
        errors.push('Price is required');
    } else {
        const priceStr = data.price.replace(/[^0-9.]/g, '');
        if (!validator.isFloat(priceStr, { min: 0 })) {
            errors.push('Invalid price format');
        } else {
            sanitized.price = data.price.trim();
        }
    }

    // Validate stock
    if (data.stock !== undefined) {
        const stock = parseInt(data.stock);
        if (isNaN(stock) || stock < 0) {
            errors.push('Stock must be a non-negative number');
        } else {
            sanitized.stock = stock;
        }
    }

    // Validate featured (boolean)
    if (data.featured !== undefined) {
        sanitized.featured = data.featured === 'true' || data.featured === true;
    }

    return {
        valid: errors.length === 0,
        data: sanitized,
        errors,
    };
};

/**
 * Validate banner data
 * @param {object} data - Banner data
 * @returns {object} - { valid: boolean, data: object, errors: array }
 */
export const validateBannerData = (data) => {
    const errors = [];
    const sanitized = {};

    if (data.text !== undefined) {
        if (typeof data.text !== 'string') {
            errors.push('Banner text must be a string');
        } else {
            sanitized.text = sanitizeHTML(data.text.trim());
            if (sanitized.text.length > 500) {
                errors.push('Banner text cannot exceed 500 characters');
            }
        }
    }

    if (data.active !== undefined) {
        sanitized.active = data.active === true || data.active === 'true';
    }

    return {
        valid: errors.length === 0,
        data: sanitized,
        errors,
    };
};

/**
 * Rate limiting using in-memory store (simple implementation)
 * For production, use Redis-based solution like @upstash/ratelimit
 */
const requestStore = new Map();

export const rateLimit = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute
        maxRequests = 60, // 60 requests per window
    } = options;

    return (req) => {
        const identifier = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();

        // Clean up old entries
        for (const [key, data] of requestStore.entries()) {
            if (now - data.windowStart > windowMs) {
                requestStore.delete(key);
            }
        }

        // Get or create entry for this IP
        let entry = requestStore.get(identifier);

        if (!entry || (now - entry.windowStart) > windowMs) {
            // New window
            entry = {
                windowStart: now,
                count: 1,
            };
            requestStore.set(identifier, entry);
            return { allowed: true, remaining: maxRequests - 1 };
        }

        // Increment count
        entry.count++;

        if (entry.count > maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                retryAfter: Math.ceil((windowMs - (now - entry.windowStart)) / 1000),
            };
        }

        return {
            allowed: true,
            remaining: maxRequests - entry.count,
        };
    };
};

/**
 * File upload validation
 * @param {object} file - Uploaded file
 * @returns {object} - { valid: boolean, error: string }
 */
export const validateImageUpload = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.mimetype || file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed',
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File too large. Maximum size is 10MB',
        };
    }

    return { valid: true };
};
