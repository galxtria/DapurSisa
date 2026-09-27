// Foto asli tiap resep — file lokal di public/food/ (terverifikasi visual,
// 100% offline setelah install PWA).
export const fotoResep = (id) => `${import.meta.env.BASE_URL}food/${id}.jpg`
