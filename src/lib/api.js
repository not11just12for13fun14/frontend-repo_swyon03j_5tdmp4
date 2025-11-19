const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const api = {
  base: BACKEND_URL,
  async listProducts(params = {}) {
    const url = new URL(`${BACKEND_URL}/api/products`)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)
    return res.json()
  },
  async seedProducts() {
    const res = await fetch(`${BACKEND_URL}/api/products/sample-seed`)
    if (!res.ok) throw new Error('Failed to seed products')
    return res.json()
  },
  async createOrder(payload) {
    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Failed to create order')
    }
    return res.json()
  }
}
