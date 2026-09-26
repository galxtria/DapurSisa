import { useMemo, useState } from 'react'
import {
  ChefHat, Search, Plus, X, Check, Clock, Heart, Flame, CookingPot,
  Refrigerator, UtensilsCrossed, Soup, Sparkles, Trash2, Info, Users, BookOpen, Star,
} from 'lucide-react'
import { MASTER_BAHAN, MASTER_ALAT, RECIPES } from './data/recipes.js'
import { matchRecipes } from './lib/match.js'

const FAV_KEY = 'dapursisa-fav-v1'
const loadFav = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] } }

const ALAT_ICON = {
  kompor: Flame, wajan: Flame, panci: CookingPot, teflon: UtensilsCrossed,
  ricecooker: CookingPot, kukusan: Soup, oven: CookingPot, blender: Soup,
  grill: Flame, microwave: CookingPot,
}

function Chip({ label, onRemove, tone = 'green' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-200' : 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>
      <Check size={12} className="text-green-400" /> {label}
      <button onClick={onRemove} className="hover:text-red-400"><X size={12} /></button>
    </span>
  )
}

export default function App() {
  const [punyaBahan, setPunyaBahan] = useState(['nasi', 'telur', 'bawang merah', 'bawang putih', 'cabai'])
  const [punyaAlat, setPunyaAlat] = useState(['kompor', 'wajan', 'panci', 'teflon'])
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState('')
  const [minSkor, setMinSkor] = useState(40)
  const [hanyaBisa, setHanyaBisa] = useState(false)
  const [detail, setDetail] = useState(null)
  const [fav, setFav] = useState(loadFav)
  const [hanyaFav, setHanyaFav] = useState(false)

  const hasil = useMemo(() => {
    let r = matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat })
    r = r.filter((x) => x.persen >= minSkor)
    if (hanyaBisa) r = r.filter((x) => x.bisaDibuat)
    if (hanyaFav) r = r.filter((x) => fav.includes(x.id))
    return r
  }, [punyaBahan, punyaAlat, minSkor, hanyaBisa, hanyaFav, fav])

  const saran = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return MASTER_BAHAN.filter((b) => b.includes(q) && !punyaBahan.includes(b)).slice(0, 8)
  }, [query, punyaBahan])

  const addBahan = (b) => {
    const v = b.trim().toLowerCase()
    if (!v || punyaBahan.includes(v)) return
    setPunyaBahan((p) => [...p, v]); setQuery(''); setCustom('')
  }
  const toggleAlat = (id) => setPunyaAlat((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const toggleFav = (id) => setFav((f) => {
    const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    localStorage.setItem(FAV_KEY, JSON.stringify(n))
    return n
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-700 flex items-center justify-center shadow-lg">
              <ChefHat size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">DapurSisa</h1>
              <p className="text-xs text-zinc-400">Input sisa bahan + alat → keluar menu + cara buat • offline</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400">
            {RECIPES.length} resep • {hasil.length} cocok
          </span>
        </header>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* INPUT */}
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><Refrigerator size={15} className="text-green-400" /> 1. Bahan sisa yang ada</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addBahan(query) }}
                  placeholder="Ketik: telur, tempe, wortel…" className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-green-500" />
                {saran.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-2xl border border-zinc-700 bg-zinc-950 shadow-xl overflow-hidden">
                    {saran.map((s) => (
                      <button key={s} onClick={() => addBahan(s)} className="w-full text-left text-sm px-4 py-2 hover:bg-zinc-800 flex items-center gap-2">
                        <Plus size={13} className="text-green-400" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addBahan(custom) }}
                  placeholder="Bahan lain (mis. kornet)…" className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-3 py-2 text-sm outline-none focus:border-green-500" />
                <button onClick={() => addBahan(custom || query)} className="px-3 rounded-2xl bg-green-500 text-black text-sm font-semibold hover:bg-green-400 flex items-center gap-1">
                  <Plus size={14} /> Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {punyaBahan.map((b) => (
                  <Chip key={b} label={b} onRemove={() => setPunyaBahan((p) => p.filter((x) => x !== b))} />
                ))}
                {punyaBahan.length === 0 && <p className="text-xs text-zinc-500">Belum ada bahan. Tambahkan dulu.</p>}
              </div>
              {punyaBahan.length > 0 && (
                <button onClick={() => setPunyaBahan([])} className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={11} /> Kosongkan</button>
              )}
            </div>

            <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><CookingPot size={15} className="text-orange-400" /> 2. Alat masak yang ada</h2>
              <div className="grid grid-cols-2 gap-2">
                {MASTER_ALAT.map((a) => {
                  const Icon = ALAT_ICON[a.id] || CookingPot
                  const on = punyaAlat.includes(a.id)
                  return (
                    <button key={a.id} onClick={() => toggleAlat(a.id)}
                      className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-2xl border transition ${on ? 'border-green-500/50 bg-green-500/10 text-green-100' : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500'}`}>
                      <Icon size={14} className={on ? 'text-green-400' : 'text-zinc-500'} />
                      {a.label}
                      {on && <Check size={12} className="ml-auto text-green-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-zinc-900/70 border border-zinc-800 p-5 space-y-3">
              <h2 className="text-sm font-semibold">3. Filter</h2>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Kecocokan minimal</span><span className="font-mono text-zinc-200">{minSkor}%</span>
                </div>
                <input type="range" min={0} max={90} step={5} value={minSkor} onChange={(e) => setMinSkor(Number(e.target.value))}
                  className="w-full" style={{ '--fill': `${(minSkor / 90) * 100}%` }} />
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <button onClick={() => setHanyaBisa(!hanyaBisa)} className={`w-9 h-5 rounded-full relative transition ${hanyaBisa ? 'bg-green-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hanyaBisa ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                Hanya yang langsung bisa dibuat
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <button onClick={() => setHanyaFav(!hanyaFav)} className={`w-9 h-5 rounded-full relative transition ${hanyaFav ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hanyaFav ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                Hanya favorit ♥ ({fav.length})
              </label>
            </div>
          </section>

          {/* HASIL */}
          <section className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles size={15} className="text-green-400" />
              <h2 className="font-semibold">Menu yang bisa dibuat ({hasil.length})</h2>
              <span className="text-[11px] text-zinc-500">diurutkan dari paling cocok</span>
            </div>
            {hasil.length === 0 && (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-10 text-center space-y-2">
                <Info size={24} className="mx-auto text-zinc-600" />
                <p className="text-sm font-semibold">Tidak ada yang cocok</p>
                <p className="text-xs text-zinc-500">Turunkan filter kecocokan atau tambah bahan.</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {hasil.map((r) => (
                <div key={r.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/70 overflow-hidden hover:border-green-500/50 transition">
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{r.kategori} • {r.level}</p>
                        <h3 className="font-bold leading-tight">{r.nama}</h3>
                      </div>
                      <button onClick={() => toggleFav(r.id)} className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition ${fav.includes(r.id) ? 'border-pink-500 bg-pink-500/15 text-pink-400' : 'border-zinc-700 text-zinc-500 hover:text-pink-400'}`}>
                        <Heart size={14} className={fav.includes(r.id) ? 'fill-pink-400' : ''} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {r.waktu} mnt</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {r.porsi} porsi</span>
                      {r.bisaDibuat
                        ? <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500 text-black font-bold">BISA DIBUAT</span>
                        : <span className="ml-auto font-mono text-green-300">{r.persen}% cocok</span>}
                    </div>
                    {!r.bisaDibuat && (
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-600" style={{ width: `${r.persen}%` }} />
                      </div>
                    )}
                    {(r.kurang.length > 0 || r.alatKurang.length > 0) && (
                      <div className="text-[11px] space-y-1">
                        {r.kurang.length > 0 && <p className="text-zinc-400">Kurang: <b className="text-amber-300">{r.kurang.join(', ')}</b></p>}
                        {r.alatKurang.length > 0 && <p className="text-zinc-400">Alat kurang: <b className="text-orange-300">{r.alatKurang.join(', ')}</b></p>}
                        {r.opsionalCocok.length > 0 && <p className="text-zinc-500">+ bonus: kamu punya {r.opsionalCocok.join(', ')} 🎉</p>}
                      </div>
                    )}
                    <button onClick={() => setDetail(r)} className="w-full text-sm font-semibold py-2.5 rounded-2xl bg-white text-black hover:bg-green-300 transition flex items-center justify-center gap-1.5">
                      <BookOpen size={14} /> Lihat Cara Buat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="text-center text-[11px] text-zinc-600 pb-4">
          DapurSisa • React + Lucide • 100% offline, data tersimpan di browser.
        </footer>
      </div>

      {/* MODAL DETAIL */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-700 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-zinc-500">{detail.kategori} • {detail.level} • {detail.waktu} mnt • {detail.porsi} porsi</p>
                <h2 className="text-xl font-bold">{detail.nama}</h2>
                <p className={`text-xs mt-1 font-semibold ${detail.bisaDibuat ? 'text-green-400' : 'text-amber-300'}`}>
                  {detail.bisaDibuat ? '✅ Semua bahan & alat tersedia!' : `⛔ Kurang ${detail.kurang.length} bahan${detail.alatKurang.length ? ` + ${detail.alatKurang.length} alat` : ''}`}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                <h3 className="text-xs font-bold text-zinc-300">BAHAN WAJIB</h3>
                {detail.bahan.map((b) => {
                  const ada = punyaBahan.map((x) => x.toLowerCase()).includes(b.toLowerCase())
                  return (
                    <p key={b} className={`text-sm flex items-center gap-2 ${ada ? 'text-green-300' : 'text-red-300'}`}>
                      {ada ? <Check size={14} /> : <X size={14} />} {b} {!ada && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/40">beli</span>}
                    </p>
                  )
                })}
                {detail.opsional?.length > 0 && (
                  <>
                    <h3 className="text-xs font-bold text-zinc-500 pt-2">OPSIONAL (kalau ada)</h3>
                    {detail.opsional.map((b) => (
                      <p key={b} className="text-xs text-zinc-400">• {b}</p>
                    ))}
                  </>
                )}
              </div>
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                <h3 className="text-xs font-bold text-zinc-300">ALAT</h3>
                {detail.alat.map((a) => {
                  const ada = !detail.alatKurang.includes(a)
                  return <p key={a} className={`text-sm flex items-center gap-2 ${ada ? 'text-green-300' : 'text-red-300'}`}>{ada ? <Check size={14} /> : <X size={14} />} {a}</p>
                })}
                <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <Star size={12} className="text-amber-400" /> Tips: {detail.tips}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><UtensilsCrossed size={14} className="text-green-400" /> Cara buat</h3>
              {detail.langkah.map((s, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="text-zinc-200 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
