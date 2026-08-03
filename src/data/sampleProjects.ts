import { SampleProject } from '../types';

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'ecommerce-app',
    name: 'React E-Commerce Web App',
    description: 'Modern Vite + React 19 product showcase with shopping cart, filtering, and responsive design.',
    badge: 'React 19 + Tailwind',
    files: [
      {
        path: 'package.json',
        name: 'package.json',
        size: 840,
        extension: 'json',
        isBinary: false,
        content: `{
  "name": "nexus-store",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.450.0",
    "motion": "^12.0.0"
  }
}`,
      },
      {
        path: '.env.example',
        name: '.env.example',
        size: 120,
        extension: 'example',
        isBinary: false,
        content: `# NEXUS STORE ENVIRONMENT
VITE_API_URL=https://api.nexusstore.com/v1
STRIPE_PUBLIC_KEY=pk_test_sample123
`,
      },
      {
        path: 'src/App.tsx',
        name: 'App.tsx',
        size: 2450,
        extension: 'tsx',
        isBinary: false,
        content: `import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Star, Filter, ShieldCheck } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  category: string;
  image: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Mock API fetch
    setProducts([
      { id: '1', name: 'Acoustic Wireless Headphones', price: 199.99, rating: 4.8, category: 'Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
      { id: '2', name: 'Ergonomic Desk Chair', price: 349.00, rating: 4.9, category: 'Furniture', image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=500&q=80' },
      { id: '3', name: 'Smart Fitness Watch', price: 149.50, rating: 4.6, category: 'Wearables', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' }
    ]);
  }, []);

  const filtered = products.filter(p => 
    (filter === 'All' || p.category === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="main-container" className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header id="site-header" className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl text-slate-900">Nexus Store</span>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            id="search-input"
            type="text" 
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Featured Catalog</h1>
          <div className="flex gap-2">
            {['All', 'Audio', 'Furniture', 'Wearables'].map(cat => (
              <button
                key={cat}
                id={\`filter-btn-\${cat}\`}
                onClick={() => setFilter(cat)}
                className={\`px-3 py-1.5 rounded-full text-xs font-medium transition-colors \${filter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}\`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="text-xs text-indigo-600 font-semibold mb-1">{item.category}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">\${item.price.toFixed(2)}</span>
                  <button id={\`add-cart-\${item.id}\`} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`,
      },
    ],
  },
  {
    id: 'legacy-unoptimized',
    name: 'Legacy Unoptimized Dashboard (Needs Audit)',
    description: 'Sample web app containing hardcoded secrets, dangerous innerHTML, missing accessibility tags, and infinite re-render anti-patterns.',
    badge: 'Contains Anti-Patterns',
    files: [
      {
        path: 'package.json',
        name: 'package.json',
        size: 400,
        extension: 'json',
        isBinary: false,
        content: `{
  "name": "legacy-app",
  "version": "0.1.0",
  "dependencies": {
    "react": "17.0.2"
  }
}`,
      },
      {
        path: 'src/Dashboard.jsx',
        name: 'Dashboard.jsx',
        size: 1800,
        extension: 'jsx',
        isBinary: false,
        content: `import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  
  // Hardcoded Secret Anti-Pattern
  const API_KEY = "AIzaSyB_SampleHardcodedKeyUnsafe99881";

  // Infinite effect re-render loop hazard
  useEffect(() => {
    setData({ user: "Admin", timestamp: Date.now() });
  });

  const renderRawHTML = (htmlString) => {
    // Dangerous innerHTML anti-pattern
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  return (
    <div className="p-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
      <h1>Legacy System Panel</h1>
      
      {/* Missing alt attribute accessibility flaw */}
      <img src="https://via.placeholder.com/150" />

      {/* Clickable div without role or tabIndex */}
      <div onClick={() => alert('Clicked')} className="p-4 bg-white/20 my-4 cursor-pointer">
        Click Here to Refresh
      </div>

      {renderRawHTML("<p>Unsanitized user html</p>")}
    </div>
  );
}
`,
      },
    ],
  },
  {
    id: 'express-rest-api',
    name: 'Express REST Service & API',
    description: 'Full-stack Express.js backend with JSON validation, CORS setup, and route modularity.',
    badge: 'Node.js Express',
    files: [
      {
        path: 'package.json',
        name: 'package.json',
        size: 520,
        extension: 'json',
        isBinary: false,
        content: `{
  "name": "api-service",
  "type": "module",
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3"
  }
}`,
      },
      {
        path: '.env.example',
        name: '.env.example',
        size: 110,
        extension: 'example',
        isBinary: false,
        content: `PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/db
JWT_SECRET=your_jwt_secret_here
`,
      },
      {
        path: 'server.js',
        name: 'server.js',
        size: 1100,
        extension: 'js',
        isBinary: false,
        content: `import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/data', (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    return res.json({ success: true, user: { name, email } });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(\`API active on port \${PORT}\`));
`,
      },
    ],
  },
];
