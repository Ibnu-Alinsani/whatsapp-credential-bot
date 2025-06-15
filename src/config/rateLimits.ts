export const rateLimits: Record<string, { max: number; windowMs: number }> = {
  verifikasi: { max: 5, windowMs: 10 * 60_000 },
  setpin:     { max: 3, windowMs: 10 * 60_000 },
  export:     { max: 1, windowMs: 30_000 },
  import:     { max: 2, windowMs: 60_000 },
  hapus:      { max: 5, windowMs: 60_000 },
  simpan:     { max: 10, windowMs: 60_000 },
  lihat:      { max: 20, windowMs: 60_000 },
  list:       { max: 5, windowMs: 30_000 },
  riwayat:    { max: 5, windowMs: 30_000 },
  logout:     { max: 3, windowMs: 5 * 60_000 },
  status:     { max: 10, windowMs: 5 * 60_000 }
};
