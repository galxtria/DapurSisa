// Client Gemini untuk DapurSisa — mode langsung pakai.
// Key utama dibake saat build via VITE_GEMINI_API_KEY (owner), user tidak perlu isi.
// User key (localStorage) tetap didukung sebagai override opsional.
// Hybrid: kalau AI gagal / offline / tanpa key, UI fallback ke matchRecipes() lokal.

// Urutan model yang dicoba. Kalau yang pertama sibuk (503), otomatis pindah ke berikut.
const MODELS = ['gemini-flash-latest', 'gemini-3.8-flash']
const endpoint = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`

const tunggu = (ms, signal) => new Promise((res, rej) => {
  const t = setTimeout(res, ms)
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('aborted', 'AbortError')) }, { once: true })
})

const KATEGORI_VALID = ['Nasi', 'Mie', 'Sayur', 'Lauk', 'Sup', 'Camilan', 'Minuman']
const ALAT_VALID = ['kompor', 'wajan', 'panci', 'teflon', 'ricecooker', 'kukusan', 'oven', 'blender', 'grill', 'microwave']

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || `resep-${Date.now()}`
}

function bersihkanJson(text) {
  // Gemini kadang membungkus dengan ```json ... ```
  let t = (text || '').trim()
  t = t.replace(/^```(json)?/i, '').replace(/```$/i, '').trim()
  const a = t.indexOf('[')
  const b = t.lastIndexOf(']')
  if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1)
  return t
}

function normalisasi(arr, punyaBahan, punyaAlat) {
  const punya = new Set((punyaBahan || []).map((x) => String(x).trim().toLowerCase()))
  const alatPunya = new Set(punyaAlat || [])
  const now = Date.now()
  return (Array.isArray(arr) ? arr : []).slice(0, 5).map((r, i) => {
    const bahan = (r.bahan || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean)
    const alat = (r.alat || []).map((x) => String(x).trim().toLowerCase()).filter((x) => ALAT_VALID.includes(x))
    const kurang = bahan.filter((b) => !punya.has(b))
    const alatKurang = alat.filter((a) => !alatPunya.has(a))
    return {
      id: r.id ? slug(String(r.id)) : `${slug(r.nama || 'resep-ai')}-${now % 100000}-${i}`,
      nama: r.nama || 'Resep AI',
      kategori: KATEGORI_VALID.includes(r.kategori) ? r.kategori : 'Lauk',
      waktu: Number(r.waktu) || 20,
      level: ['Mudah', 'Sedang', 'Sulit'].includes(r.level) ? r.level : 'Mudah',
      porsi: Number(r.porsi) || 2,
      deskripsi: r.deskripsi || 'Resep dibuat AI dari bahan dan alat yang kamu punya.',
      kalori: r.kalori || '±300 kkal/porsi',
      bahan,
      takaran: Array.isArray(r.takaran) && r.takaran.length
        ? r.takaran.map((t) => ({ n: String(t.n || '').toLowerCase(), j: String(t.j || '') }))
        : bahan.map((b) => ({ n: b, j: '' })),
      opsional: (r.opsional || []).map((x) => String(x).toLowerCase()),
      alat: alat.length ? alat : ['kompor', 'wajan'],
      langkah: (r.langkah || []).map((x) => String(x)),
      tips: r.tips || 'Cicipi dan koreksi rasa sebelum disajikan.',
      video: null,
      cocok: bahan.filter((b) => punya.has(b)),
      kurang,
      opsionalCocok: [],
      alatKurang,
      skor: kurang.length === 0 && alatKurang.length === 0 ? 1 : 0.95,
      persen: kurang.length === 0 && alatKurang.length === 0 ? 100 : 95,
      bisaDibuat: kurang.length === 0 && alatKurang.length === 0,
      dariAI: true,
    }
  })
}

function buildPrompt(bahan, alat) {
  return `Kamu adalah chef Indonesia ahli masak dari sisa bahan (DapurSisa).
BAHAN TERSEDIA: ${bahan.join(', ') || '-'}
ALAT TERSEDIA: ${alat.join(', ') || '- (asumsikan kompor + wajan)'}

Tugas: buatkan 3 resep Indonesia yang BISA DIBUAT 100% dari bahan & alat di atas.
Prioritaskan bahan yang tersedia. Boleh tambah bumbu dasar umum (garam, gula, lada, minyak, air) tanpa dihitung sebagai bahan kurang.
Alat yang dipakai HANYA dari daftar ini: ${ALAT_VALID.join(', ')}.
Kategori HANYA salah satu dari: ${KATEGORI_VALID.join(', ')}.

Wajib output JSON ARRAY saja (tanpa markdown, tanpa penjelasan), tiap item format:
{"id":"slug-unik","nama":"...","kategori":"...","waktu":15,"level":"Mudah","porsi":2,"deskripsi":"1-2 kalimat","kalori":"±... kkal/porsi","bahan":["nasi","telur",...],"takaran":[{"n":"nasi","j":"400 g"}],"opsional":[],"alat":["kompor","wajan"],"langkah":["langkah 1...","langkah 2...",minimal 5],"tips":"..."}
- "bahan": huruf kecil semua, hanya bahan yang tersedia + bumbu dasar umum.
- "langkah": konkret, ada durasi dan api.
- Bahasa Indonesia.`
}

function pesanError(status, mentah) {
  const m = String(mentah || '')
  if (status === 400 && /key/i.test(m)) return 'API key tidak valid. Owner perlu cek key di Google AI Studio.'
  if (status === 429 || /quota|rate/i.test(m)) return 'Kuota gratis Gemini habis. Tunggu ±1 menit lalu tekan "Buatkan lagi".'
  if (status === 503 || /high demand|overloaded|unavailable/i.test(m)) return 'Server AI Google sedang penuh (high demand, biasanya sementara). Tunggu ±30 detik lalu tekan "Buatkan lagi ✨". Resep lokal tetap bisa dipakai di bawah.'
  if (/fetch|network|load failed/i.test(m)) return 'Internet bermasalah. Cek koneksi lalu coba lagi (mode lokal tetap jalan offline).'
  return m || `Gemini error ${status}`
}

async function panggilModel(model, key, body, signal) {
  const res = await fetch(endpoint(model, key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body,
  })
  if (!res.ok) {
    let mentah = ''
    try { mentah = (await res.json())?.error?.message || '' } catch { /* abaikan */ }
    throw { status: res.status, pesan: pesanError(res.status, mentah), sibuk: res.status === 503 || res.status === 429 || /high demand|overloaded|unavailable|quota|rate/i.test(mentah) }
  }
  return res.json()
}

export async function generateRecipesWithAI({ bahan, alat, apiKey, signal }) {
  const key = (apiKey || '').trim() || getDefaultKey()
  if (!key) throw new Error('AI belum dikonfigurasi. Owner perlu menambah VITE_GEMINI_API_KEY saat build.')
  if (!bahan || !bahan.length) throw new Error('Isi minimal 1 bahan dulu sebelum minta ke AI.')

  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(bahan, alat) }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 4000, responseMimeType: 'application/json' },
  })

  let terakhir = null
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = await panggilModel(model, key, body, signal)
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
        if (!text) throw { status: 0, pesan: 'Respons AI kosong. Coba lagi.', sibuk: true }
        let arr
        try {
          arr = JSON.parse(bersihkanJson(text))
        } catch {
          throw { status: 0, pesan: 'AI mengembalikan format tidak valid. Coba lagi.', sibuk: true }
        }
        const hasil = normalisasi(arr, bahan, alat)
        if (!hasil.length) throw { status: 0, pesan: 'AI tidak menghasilkan resep. Coba ubah bahan/alat.', sibuk: false }
        return hasil
      } catch (e) {
        if (e?.status && !e?.sibuk) throw new Error(e.pesan) // error permanen (key salah) → langsung keluar
        terakhir = e
        if (attempt < 2) { try { await tunggu(2000, signal) } catch { throw new Error('Dibatalkan.') } }
      }
    }
    // jeda singkat sebelum pindah model cadangan
    try { await tunggu(1000, signal) } catch { throw new Error('Dibatalkan.') }
  }
  throw new Error(terakhir?.pesan || 'AI sedang sibuk. Tunggu sebentar lalu coba lagi.')
}

export function getDefaultKey() {
  try {
    // Pola standar import.meta.env.X agar Vite bisa inline saat build.
    // (Jangan pakai import.meta?.env — optional chaining menggagalkan replacement Vite.)
    const v = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || ''
    return String(v).trim()
  } catch {
    return ''
  }
}

export function hasBuiltInKey() {
  return !!getDefaultKey()
}

// Key efektif: user override > built-in env. Frontend tidak pernah memaksa user isi.
export function resolveKey(userKey) {
  return ((userKey || '').trim() || getDefaultKey()).trim()
}
