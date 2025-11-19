import { useEffect, useState, useMemo } from 'react'
import { api } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Search, Filter, Package, ChevronRight, BadgeCheck } from 'lucide-react'

const categories = [
  { key: 'all', label: 'All' },
  { key: '3d-printed', label: '3D Printed' },
  { key: 'laser-engraved', label: 'Laser Engraved' },
  { key: 'electronics', label: 'Electronics' },
]

function ProductCard({ item, onAdd }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="group bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
        <img src={item.images?.[0] || '/placeholder.png'} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
        {item.in_stock ? (
          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full inline-flex items-center gap-1"><BadgeCheck size={14}/> In Stock</span>
        ) : (
          <span className="absolute top-2 left-2 bg-slate-600 text-white text-xs px-2 py-1 rounded-full">Out of Stock</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">{item.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
          </div>
          <span className="font-semibold text-slate-900">${item.price.toFixed(2)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">{item.category.replace('-', ' ')}</span>
          <button onClick={() => onAdd(item)} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <ShoppingCart size={16}/> Add
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Storefront() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  const [toast, setToast] = useState(null)

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        // try listing products; if empty, seed then list again
        let res = await api.listProducts({ q: search, category: category === 'all' ? undefined : category, min_price: minPrice || undefined, max_price: maxPrice || undefined })
        if (!res.items?.length) {
          await api.seedProducts()
          res = await api.listProducts({ q: search, category: category === 'all' ? undefined : category, min_price: minPrice || undefined, max_price: maxPrice || undefined })
        }
        setItems(res.items || [])
      } catch (e) {
        setError(e.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, minPrice, maxPrice])

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id)
      let updated
      if (existing) {
        updated = prev.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p))
      } else {
        updated = [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1 }]
      }
      setToast({ type: 'success', message: `${product.title} added to cart` })
      return updated
    })
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart])

  const checkout = async () => {
    try {
      const payload = {
        items: cart.map((c) => ({ product_id: c.id, title: c.title, price: c.price, quantity: c.quantity })),
        customer: {
          full_name: 'Guest Buyer',
          email: 'guest@example.com',
          phone: '+10000000000',
          address_line1: 'Pay on Delivery',
          city: 'N/A', state: 'N/A', postal_code: '00000', country: 'N/A'
        },
        subtotal: Number(subtotal.toFixed(2)),
        shipping: 0,
        total: Number(subtotal.toFixed(2)),
      }
      const res = await api.createOrder(payload)
      setToast({ type: 'success', message: `Order placed! Ref: ${res.order_id}` })
      setCart([])
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Failed to place order' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Package className="text-slate-900"/>
          <h1 className="font-semibold text-slate-900">Newtonbotics Lab Store</h1>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search parts, specs, tags" className="pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1.5 rounded-lg text-sm text-slate-700"><Filter size={14}/> Filters</div>
            <div className="flex items-center gap-2 text-slate-800"><ShoppingCart size={18}/> <span className="text-sm">{cart.reduce((s,i)=>s+i.quantity,0)}</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_3fr] gap-6">
        <aside className="bg-white border border-slate-200 rounded-xl p-4 h-fit">
          <h2 className="font-semibold text-slate-900 mb-3">Categories</h2>
          <div className="flex flex-col gap-2">
            {categories.map((c)=>(
              <button key={c.key} onClick={()=>setCategory(c.key)} className={`text-left px-3 py-2 rounded-lg border ${category===c.key? 'bg-slate-900 text-white border-slate-900':'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}>{c.label}</button>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Price</h3>
            <div className="flex items-center gap-2">
              <input value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} placeholder="Min" className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 text-sm"/>
              <input value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder="Max" className="w-1/2 px-3 py-2 rounded-lg border border-slate-300 text-sm"/>
            </div>
          </div>
          <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">Pay on delivery. No upfront payment required.</div>
        </aside>
        <section>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length:6}).map((_,i)=> (
                <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-xl h-60"/>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{items.length} items</p>
                <button onClick={checkout} className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-800">
                  Proceed to Checkout <ChevronRight size={16}/>
                </button>
              </div>
              <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <ProductCard key={item.id || item.slug} item={item} onAdd={addToCart}/>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </section>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg">
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
