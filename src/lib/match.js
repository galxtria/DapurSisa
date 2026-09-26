// Skor matching: bahan wajib yang cocok + penalti alat yang hilang.

const norm = (s) => s.trim().toLowerCase()

export function matchRecipes({ recipes, punyaBahan, punyaAlat }) {
  const punya = new Set(punyaBahan.map(norm))
  const alatPunya = new Set(punyaAlat)

  return recipes.map((r) => {
    const cocok = r.bahan.filter((b) => punya.has(norm(b)))
    const kurang = r.bahan.filter((b) => !punya.has(norm(b)))
    const opsionalCocok = (r.opsional || []).filter((b) => punya.has(norm(b)))

    // alat: cek alat wajib, boleh diganti sesuai peta gantiAlat
    const alatKurang = r.alat.filter((a) => {
      if (alatPunya.has(a)) return false
      const pengganti = (r.gantiAlat && r.gantiAlat[a]) || []
      return !pengganti.some((g) => alatPunya.has(g))
    })

    const skorBahan = r.bahan.length ? cocok.length / r.bahan.length : 1
    // bonus kecil tiap bahan opsional yang ternyata punya (maks +10%)
    const bonus = Math.min(0.1, opsionalCocok.length * 0.03)
    // penalti alat: tiap alat hilang -20%
    const skor = Math.max(0, Math.min(1, skorBahan + bonus - alatKurang.length * 0.2))

    return {
      ...r,
      cocok, kurang, opsionalCocok, alatKurang,
      skor, persen: Math.round(skor * 100),
      bisaDibuat: kurang.length === 0 && alatKurang.length === 0,
    }
  }).sort((a, b) => b.skor - a.skor || a.kurang.length - b.kurang.length)
}
