require('dotenv').config();
const express = require('express');
const path = require('path');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const WP_API_URL = process.env.WP_API_URL || 'http://m-one.local/wp-json/wp/v2';
const WP_USER = process.env.WP_USER || '';
const WP_PASS = process.env.WP_PASS || '';

// Middleware for security and performance
app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Build fetch headers with optional Basic Auth
const fetchHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (WP_USER && WP_PASS) {
        const encoded = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
    }
    return headers;
};

// Helper: Replace local WP image URLs with Live Link URL
const fixImageUrls = (obj) => {
    const localUrl = process.env.WP_LOCAL_URL || 'http://m-one.local';
    const publicUrl = process.env.WP_PUBLIC_URL || localUrl;
    if (!obj || localUrl === publicUrl) return obj;
    const str = JSON.stringify(obj);
    const fixed = str.split(localUrl).join(publicUrl);
    return JSON.parse(fixed);
};

// Helper: Sanitize HTML content to prevent XSS
app.locals.sanitize = (dirty) => sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'iframe']),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
        iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
        '*': ['class', 'style']
    }
});

// Route 1: Landing Page
app.get('/', async (req, res) => {
    try {
        // Fetch 3 latest posts with embedded media
        const response = await fetch(`${WP_API_URL}/posts?_embed&per_page=3`, { headers: fetchHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();
        res.render('index', { posts: fixImageUrls(posts), error: null });
    } catch (error) {
        console.error('Error fetching from WP:', error.message);
        // Prevent server crash, send empty posts and error message
        res.render('index', { posts: [], error: 'Gagal memuat berita terbaru. Silakan coba beberapa saat lagi.' });
    }
});

// Route 2: Daftar Berita
app.get('/berita', async (req, res) => {
    try {
        const response = await fetch(`${WP_API_URL}/posts?_embed&per_page=12`, { headers: fetchHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();
        res.render('berita', { posts: fixImageUrls(posts), error: null });
    } catch (error) {
        console.error('Error fetching from WP:', error.message);
        res.render('berita', { posts: [], error: 'Gagal memuat berita terbaru. Silakan coba beberapa saat lagi.' });
    }
});

// Route 2.1: Artikel Dinamis
app.get('/berita/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        // Fetch specific post by slug with embedded media
        const response = await fetch(`${WP_API_URL}/posts?slug=${slug}&_embed`, { headers: fetchHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const posts = await response.json();
        
        if (!posts || posts.length === 0) {
            return res.status(404).render('detail', { post: null, error: 'Artikel tidak ditemukan.' });
        }
        
        res.render('detail', { post: fixImageUrls(posts[0]), error: null });
    } catch (error) {
        console.error('Error fetching post:', error.message);
        // Handle error gracefully
        res.render('detail', { post: null, error: 'Terjadi kesalahan saat memuat artikel.' });
    }
});

// Route 3: Layanan Detail
const layananData = {
    mobil: {
        title: "M1 Bengkel Mobil",
        image: "/images/mobil.jpg",
        description: "Perawatan berkala, perbaikan mesin, dan tune-up performa tinggi oleh ahli.",
        details: [
            "Ganti Oli & Filter",
            "Servis Rem & Suspensi",
            "Tune-Up Mesin Injeksi & Karburator",
            "Overhaul Mesin",
            "Perawatan AC Mobil",
            "Spooring & Balancing"
        ]
    },
    motor: {
        title: "M1 Bengkel Motor",
        image: "/images/motor.jpg",
        description: "Servis injeksi, modifikasi, dan perawatan roda dua terlengkap.",
        details: [
            "Servis Injeksi / Karburator",
            "Ganti Oli Mesin & Gardan",
            "Perbaikan Kelistrikan",
            "Ganti Ban & Kampas Rem",
            "Modifikasi Performa",
            "Perawatan CVT Motor Matic"
        ]
    },
    chemical: {
        title: "M1 Chemical",
        image: "/images/chemical.jpg",
        description: "Bahan kimia otomotif & industri kualitas premium untuk hasil maksimal.",
        details: [
            "Engine Flush & Degreaser",
            "Injector Cleaner",
            "Carb Cleaner",
            "Brake Cleaner",
            "Radiator Coolant",
            "Industrial Lubricants"
        ]
    },
    solution: {
        title: "M1 Solution",
        image: "/images/solution.png",
        description: "Software house penyedia solusi digital, pengembangan aplikasi, dan integrasi sistem.",
        details: [
            "Pengembangan Aplikasi Web & Mobile",
            "Custom ERP & Sistem Manajemen",
            "Software POS & Kasir",
            "Integrasi API & Sistem Pihak Ketiga",
            "UI/UX Design & Prototyping",
            "Konsultasi IT & Transformasi Digital"
        ]
    }
};

app.get('/tentang', (req, res) => {
    res.render('tentang', { error: null });
});

app.get('/layanan/:id', (req, res) => {
    const { id } = req.params;
    const layanan = layananData[id];
    
    if (!layanan) {
        return res.status(404).render('layanan', { layanan: null, error: 'Layanan tidak ditemukan.' });
    }
    
    res.render('layanan', { layanan, error: null });
});

// Route 4: 404 Not Found
app.use((req, res) => {
    res.status(404).render('404');
});

// Export for Vercel serverless, listen for local dev
module.exports = app;

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running gracefully on http://localhost:${PORT}`);
    });
}
