import { useMemo, useState } from 'react'
import {
  ChefHat, Search, Plus, X, Check, Clock, Heart, Flame, CookingPot,
  Refrigerator, UtensilsCrossed, Soup, Sparkles, Trash2, BookOpen,
  Home, MessageCircle, UserRound, Bell, ChevronLeft, ChevronRight,
  SlidersHorizontal, Send, Star, Wheat, Salad, Drumstick, CupSoda,
  Cookie, LayoutGrid, Users, Bot, SearchX, BadgeCheck, Lightbulb,
    Timer, LeafyGreen, Play, Youtube,
} from 'lucide-react'
import { MASTER_BAHAN, MASTER_ALAT, RECIPES } from './data/recipes.js'
import { fotoResep } from './data/images.js'
import { matchRecipes } from './lib/match.js'
import { generateRecipesWithAI, getDefaultKey, hasBuiltInKey } from './lib/ai.js'

const FAV_KEY = 'dapursisa-fav-v1'
// Key override lama (dapursisa-gemini-key) tidak dipakai lagi — bersihkan sekali.
try { localStorage.removeItem('dapursisa-gemini-key') } catch {}
const ONBOARD_KEY = 'dapursisa-onboard-v1'
const PRIMARY = '#1d4a38'
const BTN = '#1d4a38'
const GOLD = '#b08d57'
const loadFav = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] } }

/* ---------- Foto hidangan + fallback flat ---------- */
function DishImg({ id, alt, className = '', imgClassName = '' }) {
  const [gagal, setGagal] = useState(false)
  if (gagal) {
    return (
      <div className={`flex items-center justify-center bg-[#e9e0cd] ${className}`}>
        <UtensilsCrossed size={28} className="text-orange-800/50" />
      </div>
    )
  }
  return (
    <div className={`overflow-hidden bg-orange-100 ${className}`}>
      <img
        src={fotoResep(id)} alt={alt} loading="lazy"
        onError={() => setGagal(true)}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
    </div>
  )
}

/* ---------- Kartu video tutorial ---------- */
function VideoCard({ video }) {
  const [putar, setPutar] = useState(false)
  if (!video?.id) return null
  return (
    <div className="rounded-2xl bg-black overflow-hidden shadow-sm">
      {putar ? (
        <iframe
          className="w-full aspect-video"
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.judul}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPutar(true)} className="relative w-full text-left">
          <img
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt={video.judul} loading="lazy"
            className="w-full aspect-video object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <span className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
              <Play size={24} className="text-white fill-white ml-1" />
            </span>
          </span>
          <span className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-[10px] font-bold text-white">
            <Youtube size={14} className="shrink-0" />
            <span className="truncate drop-shadow">{video.judul}</span>
          </span>
        </button>
      )}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-900">
        <p className="flex-1 min-w-0 text-[11px] text-stone-300 truncate">oleh <b className="text-white">{video.kanal}</b> • butuh internet</p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer"
          className="shrink-0 text-[10px] font-extrabold text-white bg-red-600 px-3 py-1.5 rounded-full">YouTube</a>
      </div>
    </div>
  )
}

/* ---------- Kategori dengan ikon Lucide ---------- */
const KATEGORI_MENU = [
  { id: 'Semua', icon: LayoutGrid },
  { id: 'Nasi', icon: Wheat },
  { id: 'Mie', icon: Soup },
  { id: 'Sayur', icon: LeafyGreen },
  { id: 'Lauk', icon: Drumstick },
  { id: 'Sup', icon: Salad },
  { id: 'Camilan', icon: Cookie },
  { id: 'Minuman', icon: CupSoda },
]

const ALAT_ICON = {
  kompor: Flame, wajan: Flame, panci: CookingPot, teflon: UtensilsCrossed,
  ricecooker: CookingPot, kukusan: Soup, oven: CookingPot, blender: Soup,
  grill: Flame, microwave: CookingPot,
}

const BAHAN_CEPAT = ['telur', 'tempe', 'tahu', 'ayam', 'wortel', 'kol', 'cabai', 'santan']

/* ================= ONBOARDING ================= */
function Onboarding({ onDone }) {
  return (
    <div className="min-h-[100dvh] bg-[#f7f4ee] flex flex-col px-8 pb-8 relative overflow-hidden" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))' }}>
      <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-orange-100" />
      <div className="absolute top-56 -left-24 w-64 h-64 rounded-full bg-amber-50" />
      <div className="relative flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative w-60 h-60 flex items-center justify-center">
          <div className="absolute inset-0 rounded-[52px] bg-[#ece1cb] rotate-6 shadow-inner" />
          <div className="absolute inset-0 rounded-[52px] border border-white/60 -rotate-3" />
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center text-white shadow-xl" style={{ background: BTN }}>
            <ChefHat size={52} />
          </div>
          <span className="absolute top-6 right-8 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center text-orange-700"><Soup size={20} /></span>
          <span className="absolute bottom-8 left-6 w-11 h-11 rounded-2xl bg-white shadow-md flex items-center justify-center text-orange-700"><Wheat size={20} /></span>
        </div>
        <h1 className="font-display mt-8 text-[28px] font-bold text-stone-900 leading-tight">Masak dari sisa bahan</h1>
        <p className="mt-2 text-[13px] text-stone-500 leading-relaxed max-w-[280px]">
          Catat bahan dan alat yang ada di dapurmu, DapurSisa mencarikan resep yang paling cocok.
        </p>
        <div className="flex gap-1.5 mt-5">
          <span className="w-6 h-1.5 rounded-full" style={{ background: BTN }} />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        </div>
      </div>
      <button onClick={onDone} className="w-full py-4 rounded-full text-white text-sm font-bold shadow-[0_12px_28px_rgba(29,74,56,.45)] active:scale-[.99] transition" style={{ background: BTN }}>
        Mulai Memasak
      </button>
      <button onClick={onDone} className="mt-2 text-xs font-semibold text-stone-400 py-1">Lewati</button>
    </div>
  )
}

/* ================= KARTU RESEP ================= */
function RecipeCard({ r, isFav, onFav, onDetail }) {
  return (
    <article className="bg-white rounded-[22px] border border-stone-100 shadow-[0_2px_16px_rgba(29,74,56,.08)] overflow-hidden active:scale-[.995] transition">
      <div className="flex gap-3 p-3">
        <button onClick={() => onDetail(r)} className="shrink-0">
          <DishImg id={r.id} alt={r.nama} className="h-[92px] w-[92px] rounded-2xl" />
        </button>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">{r.kategori} • {r.level}</p>
              <button onClick={() => onDetail(r)} className="text-left">
                <h3 className="font-display text-[15px] font-bold text-stone-900 leading-tight">{r.nama}</h3>
              </button>
            </div>
            <button onClick={() => onFav(r.id)} aria-label="Favorit"
              className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${isFav ? 'border-red-200 bg-red-50' : 'border-stone-200'}`}>
              <Heart size={14} className={isFav ? 'fill-red-500 text-red-500' : 'text-stone-400'} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-500">
            <span className="flex items-center gap-1"><Clock size={11} /> {r.waktu} mnt</span>
            <span className="flex items-center gap-1"><Users size={11} /> {r.porsi} porsi</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {r.bisaDibuat ? (
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                <BadgeCheck size={12} /> BISA DIBUAT
              </span>
            ) : (
              <div className="flex items-center gap-1.5 flex-1">
                <div className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#1d4a38]" style={{ width: `${r.persen}%` }} />
                </div>
                <span className="text-[10px] font-extrabold text-orange-800">{r.persen}%</span>
              </div>
            )}
            <button onClick={() => onDetail(r)} className="ml-auto text-[11px] font-bold text-white px-3.5 py-1.5 rounded-full" style={{ background: BTN }}>
              Detail
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

/* ================= APP ================= */
export default function App() {
  const [onboard, setOnboard] = useState(() => localStorage.getItem(ONBOARD_KEY) === '1')
  const [tab, setTab] = useState('beranda')
  const [punyaBahan, setPunyaBahan] = useState(['nasi', 'telur', 'bawang merah', 'bawang putih', 'cabai'])
  const [punyaAlat, setPunyaAlat] = useState(['kompor', 'wajan', 'panci', 'teflon'])
  const [query, setQuery] = useState('')
  const [cariMenu, setCariMenu] = useState('')
  const [katAktif, setKatAktif] = useState('Semua')
  const [heroIdx, setHeroIdx] = useState(0)
  const [hanyaBisa, setHanyaBisa] = useState(false)
  const [pantryTerbuka, setPantryTerbuka] = useState(true)
  const [detail, setDetail] = useState(null)
  const [fav, setFav] = useState(loadFav)
  const [chat, setChat] = useState([
    { dari: 'cs', teks: 'Halo, saya DapurSisa Care. Tulis sisa bahan yang kamu punya, saya bantu carikan resep yang cocok.' },
  ])
  const [pesan, setPesan] = useState('')
  // AI langsung pakai: key dibake via VITE_GEMINI_API_KEY, tanpa input dari user.
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiRecipes, setAiRecipes] = useState([])
  const [sumber, setSumber] = useState('lokal') // 'lokal' | 'ai'

  const builtInAda = hasBuiltInKey()
  const kunciEfektif = getDefaultKey()
  const aiSiap = !!kunciEfektif

  const mintaAI = async () => {
    if (aiLoading) return
    setAiLoading(true); setAiError('')
    try {
      const data = await generateRecipesWithAI({ bahan: punyaBahan, alat: punyaAlat, apiKey: kunciEfektif })
      setAiRecipes(data); setSumber('ai'); setHeroIdx(0)
    } catch (e) {
      setAiError(e.message || 'Gagal meminta resep ke AI.')
    } finally {
      setAiLoading(false)
    }
  }

  const hasil = useMemo(() => {
    let r = sumber === 'ai' && aiRecipes.length
      ? [...aiRecipes]
      : matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat })
    if (hanyaBisa) r = r.filter((x) => x.bisaDibuat)
    if (katAktif !== 'Semua') r = r.filter((x) => x.kategori === katAktif)
    if (cariMenu.trim()) {
      const q = cariMenu.toLowerCase()
      r = r.filter((x) => x.nama.toLowerCase().includes(q) || x.bahan.some((b) => b.includes(q)))
    }
    return r
  }, [punyaBahan, punyaAlat, hanyaBisa, katAktif, cariMenu, sumber, aiRecipes])

  const heroList = useMemo(() => (hasil.length ? hasil.slice(0, 3) : matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat }).slice(0, 3)), [hasil, punyaBahan, punyaAlat])
  const hero = heroList[Math.min(heroIdx, heroList.length - 1)]
  const jumlahBisa = useMemo(() => matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat }).filter((x) => x.bisaDibuat).length, [punyaBahan, punyaAlat])
  const sapaan = useMemo(() => {
    const jam = new Date().getHours()
    if (jam < 11) return 'Selamat pagi'
    if (jam < 15) return 'Selamat siang'
    if (jam < 19) return 'Selamat sore'
    return 'Selamat malam'
  }, [])

  const saran = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return MASTER_BAHAN.filter((b) => b.includes(q) && !punyaBahan.includes(b)).slice(0, 6)
  }, [query, punyaBahan])

  const addBahan = (b) => {
    const v = b.trim().toLowerCase()
    if (!v || punyaBahan.includes(v)) return
    setPunyaBahan((p) => [...p, v]); setQuery('')
  }
  const toggleAlat = (id) => setPunyaAlat((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const toggleFav = (id) => setFav((f) => {
    const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    localStorage.setItem(FAV_KEY, JSON.stringify(n))
    return n
  })
  const finishOnboard = () => { localStorage.setItem(ONBOARD_KEY, '1'); setOnboard(true) }

  const kirimChat = () => {
    const t = pesan.trim()
    if (!t) return
    const top = hasil[0] || matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat })[0]
    if (!top) return
    const labelSumber = sumber === 'ai' ? ' (dibuat AI ✨)' : ''
    setChat((c) => [...c,
      { dari: 'user', teks: t },
      { dari: 'cs', teks: `Dari bahan kamu${labelSumber}, resep paling cocok adalah ${top.nama} (${top.persen}% cocok, ${top.waktu} menit). Tap tombol di bawah untuk melihat cara buatnya.`, resepId: top.id },
    ])
    setPesan('')
  }

  if (!onboard) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f4ee] flex justify-center">
        <div className="w-full max-w-[430px] bg-[#f7f4ee]"><Onboarding onDone={finishOnboard} /></div>
      </div>
    )
  }

  const NAV = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'favorit', label: 'Favorit', icon: Heart },
    { id: 'bantuan', label: 'Bantuan', icon: MessageCircle },
    { id: 'profil', label: 'Profil', icon: UserRound },
  ]

  return (
    <div className="min-h-[100dvh] bg-[#f7f4ee] flex justify-center">
      <div className="w-full max-w-[430px] bg-[#f7f4ee] min-h-[100dvh] relative pb-28 overflow-x-clip">
        {/* ===== HEADER ===== */}
        <header className="px-5 pb-2 flex items-center gap-3 relative" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0" style={{ background: PRIMARY }}>
            <ChefHat size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-stone-400">{sapaan}, Sobat Dapur!</p>
            <h1 className="text-[16px] min-[380px]:text-[17px] font-extrabold text-stone-900 leading-tight tracking-tight">Mau masak apa hari ini?</h1>
          </div>
          <button aria-label="Notifikasi" className="relative w-11 h-11 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center text-stone-600">
            <Bell size={18} />
            <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        </header>

        {/* ===== BERANDA: input + rekomendasi dalam satu alur ===== */}
        {tab === 'beranda' && (
          <main className="px-5 pt-2 space-y-5 relative">

            {/* Hero */}
            {hero && (
              <section className="relative rounded-[26px] overflow-hidden shadow-[0_8px_24px_rgba(29,74,56,.22)] ring-1 ring-black/5">
                <DishImg id={hero.id} alt={hero.nama} className="h-44 min-[380px]:h-52" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <button aria-label="Sebelumnya" onClick={() => setHeroIdx((heroIdx + heroList.length - 1) % heroList.length)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-800 shadow"><ChevronLeft size={16} /></button>
                <button aria-label="Berikutnya" onClick={() => setHeroIdx((heroIdx + 1) % heroList.length)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-800 shadow"><ChevronRight size={16} /></button>
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  {hero.bisaDibuat ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold bg-green-500 text-white px-2.5 py-1 rounded-full"><BadgeCheck size={12} /> BISA DIBUAT</span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-white/90 text-stone-800 px-2.5 py-1 rounded-full">{hero.persen}% cocok</span>
                  )}
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <h2 className="font-display text-white text-[20px] font-bold leading-snug drop-shadow-md">{hero.nama}</h2>
                  <p className="text-white/80 text-[11px] mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Timer size={11} /> {hero.waktu} mnt</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {hero.porsi} porsi</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button onClick={() => setDetail(hero)} className="text-[12px] font-bold bg-white text-stone-900 px-4 py-2 rounded-full">Lihat Resep</button>
                    <div className="flex gap-1 ml-auto">
                      {heroList.map((_, i) => (
                        <span key={i} className={`h-1 rounded-full transition-all ${i === (heroIdx % heroList.length) ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Cari menu */}
            <section className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input value={cariMenu} onChange={(e) => setCariMenu(e.target.value)}
                placeholder="Cari resep atau bahan…" className="w-full bg-white border border-stone-100 rounded-2xl pl-11 pr-12 py-3.5 text-[13px] outline-none shadow-sm focus:border-orange-700" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: BTN }}><SlidersHorizontal size={15} /></span>
            </section>

            {/* Bahan milikku */}
            <section className="bg-white rounded-[26px] border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,.05)] overflow-hidden">
              <button onClick={() => setPantryTerbuka(!pantryTerbuka)} className="w-full flex items-center gap-2.5 p-4">
                <span className="w-9 h-9 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-800"><Refrigerator size={17} /></span>
                <span className="text-left flex-1">
                  <span className="block text-[14px] font-extrabold text-stone-900">Bahan di dapurmu</span>
                  <span className="block text-[11px] text-stone-400">{punyaBahan.length} bahan • {jumlahBisa} resep bisa dibuat</span>
                </span>
                <ChevronRight size={16} className={`text-stone-400 transition-transform ${pantryTerbuka ? 'rotate-90' : ''}`} />
              </button>
              {pantryTerbuka && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addBahan(query) }}
                      placeholder="Tambah bahan: telur, tempe…" className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-orange-700" />
                    {saran.length > 0 && (
                      <div className="absolute z-10 mt-1.5 w-full rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden">
                        {saran.map((s) => (
                          <button key={s} onClick={() => addBahan(s)} className="w-full text-left text-[13px] px-4 py-2.5 hover:bg-orange-50 flex items-center gap-2 text-stone-700 capitalize">
                            <Plus size={13} className="text-orange-700" /> {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {punyaBahan.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-800 capitalize">
                        <Check size={11} /> {b}
                        <button onClick={() => setPunyaBahan((p) => p.filter((x) => x !== b))} aria-label={`Hapus ${b}`}><X size={11} className="text-green-700/50" /></button>
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Tambah cepat</p>
                    <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                      {BAHAN_CEPAT.filter((b) => !punyaBahan.includes(b)).map((b) => (
                        <button key={b} onClick={() => addBahan(b)} className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 capitalize">+ {b}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-stone-50 border border-stone-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Alat masak</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MASTER_ALAT.map((a) => {
                        const Icon = ALAT_ICON[a.id] || CookingPot
                        const on = punyaAlat.includes(a.id)
                        return (
                          <button key={a.id} onClick={() => toggleAlat(a.id)}
                            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full border transition active:scale-95 ${on ? 'text-white border-transparent' : 'bg-white text-stone-500 border-stone-200'}`}
                            style={on ? { background: '#1d4a38' } : {}}>
                            <Icon size={12} /> {a.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {punyaBahan.length > 0 && (
                    <button onClick={() => setPunyaBahan([])} className="text-[11px] font-semibold text-stone-400 flex items-center gap-1"><Trash2 size={11} /> Kosongkan bahan</button>
                  )}
                </div>
              )}
            </section>

            {/* Asisten AI */}
            <section className="rounded-[26px] p-4 text-white shadow-[0_8px_24px_rgba(29,74,56,.25)]" style={{ background: '#10231b' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300"><Sparkles size={17} /></span>
                <div className="flex-1">
                  <p className="text-[14px] font-extrabold leading-tight">Asisten AI {sumber === 'ai' && <span className="text-[10px] font-bold bg-green-500 px-2 py-0.5 rounded-full ml-1">AKTIF ✨</span>}</p>
                  <p className="text-[11px] text-stone-300">Bahan + alat dibaca AI, resep dibuat khusus.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={mintaAI} disabled={aiLoading}
                  className="flex-1 py-3 rounded-2xl bg-amber-300 text-stone-900 text-[13px] font-extrabold active:scale-[.99] disabled:opacity-60 flex items-center justify-center gap-1.5">
                  {aiLoading ? 'AI sedang memasak…' : sumber === 'ai' ? 'Buatkan lagi ✨' : 'Buatkan resep dengan AI ✨'}
                </button>
                {sumber === 'ai' && (
                  <button onClick={() => { setSumber('lokal'); setAiRecipes([]) }}
                    className="px-4 py-3 rounded-2xl bg-white/10 text-[12px] font-bold">Lokal</button>
                )}
              </div>
              {aiError && <p className="mt-2 text-[11px] font-semibold text-red-300 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">{aiError}</p>}
              {!aiSiap && !aiError && (
                <p className="mt-2 text-[11px] font-semibold text-amber-200">AI belum dikonfigurasi owner. Sementara pakai resep lokal di bawah.</p>
              )}
            </section>

            {/* Kategori */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[15px] font-extrabold text-stone-900 tracking-tight flex items-center"><span className="inline-block w-1 h-4 rounded-full mr-2" style={{ background: GOLD }} />Kategori</h2>
                {katAktif !== 'Semua' && <button onClick={() => setKatAktif('Semua')} className="text-[11px] font-bold text-orange-800">Reset</button>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {KATEGORI_MENU.map((k) => {
                  const Icon = k.icon
                  const aktif = katAktif === k.id
                  return (
                    <button key={k.id} onClick={() => setKatAktif(k.id)}
                      className={`rounded-2xl border py-3 flex flex-col items-center gap-1.5 shadow-sm transition active:scale-95 ${aktif ? 'border-transparent text-white shadow-md' : 'bg-white border-stone-100 text-stone-500'}`}
                      style={aktif ? { background: '#1d4a38' } : {}}>
                      <Icon size={21} className={aktif ? 'text-amber-200' : 'text-orange-800'} />
                      <span className={`text-[10px] font-bold ${aktif ? 'text-white' : ''}`}>{k.id === 'Semua' ? 'Semua' : k.id}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Rekomendasi */}
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[15px] font-extrabold text-stone-900 tracking-tight flex items-center"><span className="inline-block w-1 h-4 rounded-full mr-2" style={{ background: GOLD }} />{sumber === 'ai' ? 'Resep dari AI ✨' : 'Rekomendasi buat kamu'} <span className="text-stone-400 font-bold ml-1">({hasil.length})</span></h2>
                <button onClick={() => setHanyaBisa(!hanyaBisa)}
                  className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1.5 rounded-full border ${hanyaBisa ? 'text-white border-transparent' : 'bg-white text-stone-500 border-stone-200'}`}
                  style={hanyaBisa ? { background: '#15803d' } : {}}>
                  {hanyaBisa && <Check size={11} />} Bisa dibuat
                </button>
              </div>
              <div className="space-y-2.5">
                {hasil.slice(0, 15).map((r) => (
                  <RecipeCard key={r.id} r={r} isFav={fav.includes(r.id)} onFav={toggleFav} onDetail={setDetail} />
                ))}
                {hasil.length === 0 && (
                  <div className="bg-white rounded-[26px] border border-stone-100 p-10 text-center">
                    <SearchX size={36} className="mx-auto text-stone-300" />
                    <p className="text-sm font-extrabold mt-3 text-stone-800">Tidak ada yang cocok</p>
                    <p className="text-xs text-stone-500 mt-1">Tambah bahan di atas atau ubah kategori.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        )}

        {/* ===== FAVORIT ===== */}
        {tab === 'favorit' && (
          <main className="px-5 pt-2 space-y-2.5 relative">
            <h2 className="text-[17px] font-extrabold text-stone-900 tracking-tight">Favorit <span className="text-stone-400">({fav.length})</span></h2>
            {[...RECIPES.filter((r) => fav.includes(r.id)), ...aiRecipes.filter((r) => fav.includes(r.id))].map((base) => {
              const full = matchRecipes({ recipes: [base], punyaBahan, punyaAlat })[0] || base
              return <RecipeCard key={base.id} r={full} isFav onFav={toggleFav} onDetail={setDetail} />
            })}
            {fav.length === 0 && (
              <div className="bg-white rounded-[26px] border border-stone-100 p-10 text-center">
                <Heart size={36} className="mx-auto text-stone-300" />
                <p className="text-sm font-extrabold mt-3 text-stone-800">Belum ada favorit</p>
                <p className="text-xs text-stone-500 mt-1">Tap ikon hati pada resep untuk menyimpan.</p>
                <button onClick={() => setTab('beranda')} className="mt-4 text-[12px] font-bold text-white px-5 py-2.5 rounded-full" style={{ background: BTN }}>Cari Resep</button>
              </div>
            )}
          </main>
        )}

        {/* ===== BANTUAN ===== */}
        {tab === 'bantuan' && (
          <main className="px-5 pt-2 space-y-3 relative">
            <div className="flex items-center gap-3 bg-white rounded-[22px] border border-stone-100 p-3.5 shadow-sm">
              <span className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-800"><Bot size={20} /></span>
              <div className="flex-1">
                <p className="text-[13px] font-extrabold text-stone-900 flex items-center gap-1.5">DapurSisa Care <BadgeCheck size={14} className="text-orange-700" /></p>
                <p className="text-[11px] text-green-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {aiSiap ? `AI aktif ✨ • ${sumber === 'ai' ? 'pakai resep AI' : 'siap dipakai'}` : 'Aktif — mode lokal'}</p>
              </div>
            </div>
            <p className="text-center text-[10px] font-semibold text-stone-400 bg-stone-100 w-fit mx-auto px-3 py-1 rounded-full">Hari ini</p>
            <div className="space-y-2">
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.dari === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm ${m.dari === 'user' ? 'text-white rounded-br-md' : 'bg-white text-stone-700 border border-stone-100 rounded-bl-md'}`}
                    style={m.dari === 'user' ? { background: BTN } : {}}>
                    {m.teks}
                    {m.resepId && (
                      <button onClick={() => { const semua = [...hasil, ...aiRecipes, ...matchRecipes({ recipes: RECIPES, punyaBahan, punyaAlat })]; const r = semua.find((x) => x.id === m.resepId); if (r) setDetail(r) }}
                        className="mt-2 block text-[11px] font-extrabold bg-orange-100 text-orange-900 px-3 py-1.5 rounded-full">Lihat resep</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {hasil.slice(0, 2).map((r) => (
                <button key={r.id} onClick={() => setDetail(r)} className="bg-white rounded-[22px] border border-stone-100 overflow-hidden text-left shadow-sm">
                  <DishImg id={r.id} alt={r.nama} className="h-28" />
                  <div className="p-3">
                    <p className="text-[12px] font-extrabold text-stone-900 leading-tight">{r.nama}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1"><Timer size={10} /> {r.waktu} mnt • {r.persen}% cocok</p>
                    <span className="inline-block mt-2 text-[10px] font-extrabold text-white px-3.5 py-1.5 rounded-full" style={{ background: BTN }}>Detail</span>
                  </div>
                </button>
              ))}
            </div>
          </main>
        )}

        {/* ===== PROFIL ===== */}
        {tab === 'profil' && (
          <main className="px-5 pt-2 space-y-3 relative">
            <div className="bg-white rounded-[26px] border border-stone-100 p-6 text-center shadow-sm">
              <div className="w-[72px] h-[72px] mx-auto rounded-[24px] flex items-center justify-center text-white shadow-md" style={{ background: BTN }}>
                <ChefHat size={34} />
              </div>
              <p className="font-extrabold mt-3 text-stone-900">Sobat Dapur</p>
              <p className="text-[11px] text-stone-400">Hybrid • lokal offline + AI Gemini</p>
              <div className="grid grid-cols-3 gap-2 mt-5">
                {[{ v: RECIPES.length, l: 'Resep' }, { v: fav.length, l: 'Favorit' }, { v: punyaBahan.length, l: 'Bahan' }].map((s) => (
                  <div key={s.l} className="bg-stone-50 border border-stone-100 rounded-2xl p-3">
                    <p className="font-extrabold text-[16px] text-stone-900">{s.v}</p>
                    <p className="text-[10px] font-semibold text-stone-400">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[26px] p-4 text-white shadow-sm" style={{ background: '#10231b' }}>
              <p className="text-[13px] font-extrabold flex items-center gap-1.5"><Bot size={16} className="text-amber-300" /> AI Gemini {aiSiap ? <span className="text-[10px] bg-green-500 px-2 py-0.5 rounded-full">AKTIF ✓</span> : <span className="text-[10px] bg-red-500 px-2 py-0.5 rounded-full">NONAKTIF</span>}</p>
              <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{builtInAda ? 'AI langsung bisa dipakai dari tombol di Beranda.' : 'AI belum dikonfigurasi owner.'}</p>
            </div>
            <div className="bg-white rounded-[26px] border border-stone-100 shadow-sm divide-y divide-stone-100">
              <button onClick={() => { localStorage.removeItem(ONBOARD_KEY); setOnboard(false) }} className="w-full flex items-center gap-3 p-4 text-left">
                <Sparkles size={17} className="text-orange-700" />
                <span className="text-[13px] font-bold text-stone-800 flex-1">Lihat intro lagi</span>
                <ChevronRight size={15} className="text-stone-300" />
              </button>
              <button onClick={() => { setFav([]); localStorage.setItem(FAV_KEY, '[]') }} className="w-full flex items-center gap-3 p-4 text-left">
                <Trash2 size={17} className="text-red-500" />
                <span className="text-[13px] font-bold text-stone-800 flex-1">Hapus semua favorit</span>
                <ChevronRight size={15} className="text-stone-300" />
              </button>
            </div>
            <p className="text-center text-[10px] text-stone-400">DapurSisa v1.1 • React + PWA + AI Gemini</p>
          </main>
        )}

        {/* ===== BOTTOM NAV ===== */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 select-none">
          {tab === 'bantuan' && (
            <div className="mx-4 mb-2 bg-white rounded-full border border-stone-200 shadow-lg flex items-center gap-2 pl-4 pr-1.5 py-1.5">
              <input value={pesan} onChange={(e) => setPesan(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') kirimChat() }}
                placeholder="Ketik pesan…" className="flex-1 text-sm outline-none bg-transparent min-w-0" />
              <button onClick={kirimChat} aria-label="Kirim" className="w-9 h-9 rounded-full text-white flex items-center justify-center shrink-0 active:scale-95 transition" style={{ background: BTN }}><Send size={15} /></button>
            </div>
          )}
          <div className="mx-4 nav-bottom rounded-[26px] text-white shadow-[0_12px_32px_rgba(16,35,27,.5)] flex justify-around px-2 py-2 ring-1 ring-white/10" style={{ background: '#10231b' }}>
            {NAV.map((n) => {
              const Icon = n.icon
              const aktif = tab === n.id
              return (
                <button key={n.id} onClick={() => setTab(n.id)} className={`flex flex-col items-center gap-1 px-4 min-[380px]:px-5 py-2 rounded-2xl transition active:scale-95 ${aktif ? 'bg-white/10' : ''}`}>
                  <Icon size={19} className={aktif ? 'text-amber-300' : 'text-stone-500'} />
                  <span className={`text-[10px] font-bold ${aktif ? 'text-amber-200' : 'text-stone-500'}`}>{n.label}</span>
                  <span className={`h-1 w-1 rounded-full ${aktif ? 'bg-amber-300' : 'bg-transparent'}`} />
                </button>
              )
            })}
          </div>
        </nav>

        {/* ===== DETAIL bottom-sheet ===== */}
        {detail && (
          <div className="fixed inset-0 z-50 flex justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDetail(null)} />
            <div className="relative w-full max-w-[430px] sheet-top max-h-[94dvh] overflow-y-auto rounded-t-[28px] bg-[#f7f4ee] shadow-2xl">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-white/80 z-10" />
              <div className="relative">
                <DishImg id={detail.id} alt={detail.nama} className="h-60 rounded-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button onClick={() => setDetail(null)} aria-label="Kembali" className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center"><ChevronLeft size={18} /></button>
                <button onClick={() => toggleFav(detail.id)} aria-label="Favorit" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center">
                  <Heart size={16} className={fav.includes(detail.id) ? 'fill-red-500 text-red-500' : ''} />
                </button>
              </div>
              <div className="p-5 -mt-6 bg-[#f7f4ee] rounded-t-[28px] relative space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-orange-700 font-extrabold">{detail.kategori} • {detail.level}</p>
                  <h2 className="font-display text-[23px] font-bold text-stone-900 leading-tight">{detail.nama}</h2>
                  <span className="block w-10 h-1 rounded-full mt-1.5" style={{ background: GOLD }} />
                  <div className="flex items-center gap-4 mt-1.5 text-[12px] text-stone-500">
                    <span className="flex items-center gap-1"><Clock size={13} /> {detail.waktu} mnt</span>
                    <span className="flex items-center gap-1"><Users size={13} /> {detail.porsi} porsi</span>
                    <span className="flex items-center gap-1"><Flame size={13} className="text-orange-600" /> {detail.kalori}</span>
                  </div>
                  <p className="text-[13px] text-stone-600 leading-relaxed mt-2">{detail.deskripsi}</p>
                  <div className={`mt-2.5 flex items-center gap-2 text-[12px] font-bold px-3.5 py-2.5 rounded-2xl ${detail.bisaDibuat ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                    {detail.bisaDibuat
                      ? <><BadgeCheck size={15} /> Semua bahan dan alat tersedia</>
                      : <><Lightbulb size={15} /> Kurang {detail.kurang.length} bahan{detail.alatKurang.length ? ` dan ${detail.alatKurang.length} alat` : ''}</>}
                  </div>
                </div>
                {detail.video?.id && (
                <div>
                  <h3 className="text-[14px] font-extrabold flex items-center gap-1.5 text-stone-900"><Youtube size={16} className="text-red-600" /> Video tutorial</h3>
                  <p className="text-[11px] text-stone-400 mb-2">Tonton cara membuatnya langsung dari kreator masak.</p>
                  <VideoCard video={detail.video} />
                </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white border border-stone-100 p-3.5 space-y-1.5 shadow-sm">
                    <h3 className="text-[10px] font-extrabold tracking-wider text-stone-400">BAHAN WAJIB</h3>
                    {detail.bahan.map((b) => {
                      const ada = punyaBahan.map((x) => x.toLowerCase()).includes(b.toLowerCase())
                      return (
                        <p key={b} className={`text-[12px] font-bold flex items-center gap-1.5 capitalize ${ada ? 'text-green-700' : 'text-red-500'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ada ? 'bg-green-100' : 'bg-red-100'}`}>
                            {ada ? <Check size={10} /> : <X size={10} />}
                          </span> {b}
                        </p>
                      )
                    })}
                    {detail.opsional?.length > 0 && (
                      <>
                        <h3 className="text-[10px] font-extrabold tracking-wider text-stone-400 pt-1">OPSIONAL</h3>
                        {detail.opsional.map((b) => <p key={b} className="text-[11px] text-stone-500 capitalize">• {b}</p>)}
                      </>
                    )}
                  </div>
                  <div className="rounded-2xl bg-white border border-stone-100 p-3.5 space-y-1.5 shadow-sm">
                    <h3 className="text-[10px] font-extrabold tracking-wider text-stone-400">ALAT</h3>
                    {detail.alat.map((a) => {
                      const ada = !detail.alatKurang.includes(a)
                      return (
                        <p key={a} className={`text-[12px] font-bold flex items-center gap-1.5 capitalize ${ada ? 'text-green-700' : 'text-red-500'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ada ? 'bg-green-100' : 'bg-red-100'}`}>
                            {ada ? <Check size={10} /> : <X size={10} />}
                          </span> {a}
                        </p>
                      )
                    })}
                    <div className="pt-1.5 flex gap-1.5 text-[11px] text-stone-500 leading-snug">
                      <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" /> {detail.tips}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-stone-100 p-3.5 shadow-sm">
                  <h3 className="text-[10px] font-extrabold tracking-wider text-stone-400 mb-2">TAKARAN LENGKAP ({detail.porsi} PORSI)</h3>
                  <div className="divide-y divide-stone-100">
                    {(detail.takaran || detail.bahan.map((b) => ({ n: b, j: '' }))).map((t) => (
                      <div key={t.n} className="flex items-baseline gap-2 py-1.5">
                        <span className="text-[12px] font-bold text-stone-800 capitalize">{t.n}</span>
                        <span className="flex-1 border-b border-dotted border-stone-200" />
                        <span className="text-[11px] text-stone-500 text-right">{t.j}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 pb-4">
                  <h3 className="text-[14px] font-extrabold flex items-center gap-1.5 text-stone-900"><BookOpen size={15} className="text-orange-800" /> Cara membuat</h3>
                  {detail.langkah.map((s, i) => (
                    <div key={i} className="flex gap-3 text-[13px] bg-white border border-stone-100 rounded-2xl p-3.5 shadow-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center" style={{ background: BTN }}>{i + 1}</span>
                      <p className="text-stone-700 leading-relaxed">{s}</p>
                    </div>
                  ))}
                  <button onClick={() => setDetail(null)} className="w-full py-4 rounded-2xl text-white text-sm font-extrabold mt-2 shadow-md active:scale-[.99]" style={{ background: BTN }}>
                    Siap Memasak
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
