# Development Plan: Aplikasi Rental Mobil

Dokumen ini membagi seluruh proses pengembangan sistem rental mobil menjadi 14 fase kerja (Phase) berukuran kecil dan terukur. Berdasarkan *Development Workflow*, setiap fase mewajibkan pemenuhan *Acceptance Criteria* dan pengecekan keamanan (*Security Checks*) sebelum melangkah ke fase berikutnya.

---

## Phase 1 — Foundation
- **Objective:** Menginisialisasi proyek Next.js, mengatur struktur folder, TailwindCSS, TypeScript, Git, dan memastikan *base architecture* siap.
- **Files/Components:** `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`.
- **Dependencies:** `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `zod`.
- **Database Changes:** None.
- **API Changes:** None.
- **Tests:** Konfigurasi `vitest` awal berjalan sukses.
- **Acceptance Criteria:** Proyek bisa dijalankan secara lokal (`npm run dev`) tanpa *error* di *browser*. Struktur direktori sesuai dengan rancangan.
- **Security Checks:** Konfirmasi bahwa `.env` telah dimasukkan ke dalam `.gitignore`.

---

## Phase 2 — Database
- **Objective:** Menginisialisasi ORM (Prisma), mendefinisikan seluruh entitas dari `DATABASE.md`, dan menerapkan migrasi pertama.
- **Files/Components:** `prisma/schema.prisma`, `lib/db.ts`.
- **Dependencies:** `prisma`, `@prisma/client`.
- **Database Changes:** Pembuatan tabel `users`, `vehicles`, `vehicle_categories`, `bookings`, dll., beserta eksekusi PostgreSQL *Exclusion Constraint*.
- **API Changes:** None.
- **Tests:** Unit test untuk memvalidasi *database connection* (DB ping).
- **Acceptance Criteria:** `npx prisma db push` atau `migrate dev` berhasil, *Client type-safe* Prisma ter- *generate*.
- **Security Checks:** *Database Credentials* tersimpan aman di `.env`.

---

## Phase 3 — Authentication
- **Objective:** Mengimplementasikan fitur registrasi, login, dan manajemen sesi berbasis peran (Admin & Customer).
- **Files/Components:** `src/app/api/auth/[...nextauth]/route.ts`, komponen UI `LoginForm`, `RegisterForm`, *middleware* proteksi rute (`middleware.ts`).
- **Dependencies:** `next-auth`, `bcrypt`.
- **Database Changes:** Integrasi *adapter* tabel sesi ke tabel `users`.
- **API Changes:** Endpoint *Auth* (Login, Logout, Current User).
- **Tests:** *End-to-End* login sukses, *login failure* dengan *password* salah.
- **Acceptance Criteria:** Pengguna dapat masuk dan keluar. *Middleware* berhasil menahan pengguna tak dikenal mengakses rute `/customer` atau `/admin`.
- **Security Checks:** Kata sandi di-*hash* dengan Bcrypt. Sesi menggunakan *Secure/HttpOnly Cookies*. Terdapat perlindungan CSRF.

---

## Phase 4 — Vehicle Management
- **Objective:** Mengembangkan fungsi *Create, Read, Update, Delete* (CRUD) untuk Master Data Mobil dan Kategori oleh Admin, termasuk unggah gambar.
- **Files/Components:** Admin API endpoints (`/api/v1/admin/vehicles`), Server Actions `createVehicle`, UI Admin Form, Integrasi AWS S3.
- **Dependencies:** `@aws-sdk/client-s3`.
- **Database Changes:** Penambahan data sampel untuk kendaraan.
- **API Changes:** Endpoint *Admin Vehicle CRUD*.
- **Tests:** Unit test fungsi mutasi data mobil, *Upload image mock test*.
- **Acceptance Criteria:** Admin dapat menambah mobil baru, memasukkan gambar, dan mengatur harga. Publik dapat melihat katalog (*Landing Page*).
- **Security Checks:** Validasi MIME type (`image/jpeg`, `image/png`) di *backend*. Admin endpoint tertutup rapat (*Role == ADMIN*).

---

## Phase 5 — Availability
- **Objective:** Membangun *core logic* yang memeriksa ketersediaan kendaraan (Availability Engine) agar tidak saling tumpang tindih.
- **Files/Components:** `server/queries/checkAvailability.ts`, fungsi validasi kalender di UI.
- **Dependencies:** date-fns (opsional untuk manipulasi tanggal).
- **Database Changes:** None.
- **API Changes:** Endpoint `/api/v1/vehicles/:id/availability`.
- **Tests:** Uji *booking overlap* menggunakan data yang telah diatur (Skenario A vs B).
- **Acceptance Criteria:** Jika sistem diminta mengecek tanggal yang sudah di-*booking*, sistem melempar status `false`.
- **Security Checks:** *Query SQL/Prisma* tahan terhadap injeksi dan validasi parameter tanggal wajib menggunakan Zod.

---

## Phase 6 — Booking
- **Objective:** Mengimplementasikan proses *Customer* melakukan transaksi pemesanan hingga berstatus `PENDING`.
- **Files/Components:** Form Checkout, Server Action `createBooking`.
- **Dependencies:** None.
- **Database Changes:** *Insert* ke tabel `bookings`.
- **API Changes:** Endpoint *Create Booking*, *List Booking*, *Cancel Booking*.
- **Tests:** Simulasi *race condition test* (Dua eksekusi pemesanan pada waktu yang persis sama).
- **Acceptance Criteria:** *Booking* dibuat dengan harga `total_price` ter-*snapshot* (berdasarkan `price_per_day` dari *database*).
- **Security Checks:** *Double Booking* digagalkan oleh *Backend/DB*. Harga dikalkulasi ulang oleh Server, **TIDAK PERNAH** dipercaya dari input klien.

---

## Phase 7 — Payment
- **Objective:** Menghubungkan pesanan dengan Payment Gateway eksternal dan menerima *Webhook* notifikasi.
- **Files/Components:** Layanan integrasi Midtrans/Stripe, `app/api/v1/payments/webhook/route.ts`.
- **Dependencies:** (SDK *Payment Gateway* yang relevan).
- **Database Changes:** *Insert* ke tabel `payments`, *Update* status di `bookings`.
- **API Changes:** Endpoint *Payment Intent*, Endpoint *Webhook Server*.
- **Tests:** Uji notifikasi *Webhook* tiruan (sukses dan gagal).
- **Acceptance Criteria:** Transaksi yang dibayar berhasil mengubah status *booking* menjadi `CONFIRMED`.
- **Security Checks:** Otorisasi HMAC/Signature pada URL webhook. Status pembayaran diverifikasi ke *gateway* sebelum dipercaya.

---

## Phase 8 — Customer Dashboard
- **Objective:** Membuat panel untuk pelanggan melihat tiket, riwayat sewa, dan status pemesanan.
- **Files/Components:** Halaman profil (`/customer/dashboard`, `/customer/bookings`), UI Kartu Transaksi.
- **Dependencies:** None.
- **Database Changes:** None.
- **API Changes:** None (Hanya query ke fungsi RSC yang telah ada).
- **Tests:** UI test menampilkan list kosong, UI test menampilkan riwayat transaksi.
- **Acceptance Criteria:** Pengguna bisa melihat detail jadwal, lokasi, dan tagihan mobil mereka. Tombol *Cancel* aktif jika masih memenuhi syarat.
- **Security Checks:** *IDOR Prevention*: Pelanggan tidak dapat mengakses transaksi pelanggan lain dengan mengubah parameter URL.

---

## Phase 9 — Admin Dashboard
- **Objective:** Membangun *Control Center* bagi administrator perusahaan rental.
- **Files/Components:** Laporan statistik (`/admin`), Tabel Master Booking, Manajemen Karyawan.
- **Dependencies:** *Chart.js* atau *Recharts* (untuk statistik visual).
- **Database Changes:** None.
- **API Changes:** Endpoint `/api/v1/admin/dashboard`.
- **Tests:** Validasi akses tanpa *role* Admin.
- **Acceptance Criteria:** Admin dapat melihat grafik transaksi harian, mengubah status *booking* manual ke `COMPLETED`, dan mencetak/ekspor daftar transaksi.
- **Security Checks:** Validasi `session.role === 'ADMIN'` diaplikasikan pada semua *Data Fetching* dan navigasi.

---

## Phase 10 — Reviews
- **Objective:** Mengizinkan pelanggan yang transaksinya selesai untuk memberikan ulasan (Bintang & Teks).
- **Files/Components:** Komponen `ReviewForm`, Komponen Penampil Ulasan Publik.
- **Dependencies:** None.
- **Database Changes:** *Insert* ke tabel `reviews`.
- **API Changes:** Endpoint `/api/v1/reviews`.
- **Tests:** Memastikan pelanggan tidak bisa mereview *booking* yang belum `COMPLETED` atau *booking* orang lain.
- **Acceptance Criteria:** Rata-rata bintang terhitung dan muncul pada Halaman Detail Mobil publik.
- **Security Checks:** XSS Sanitization pada teks komentar untuk mencegah injeksi *script* dari pelanggan.

---

## Phase 11 — Testing
- **Objective:** Mencakup seluruh alur utama dengan pengujian E2E (End-to-End).
- **Files/Components:** Skrip *Playwright* (`tests/e2e`).
- **Dependencies:** `@playwright/test`.
- **Database Changes:** None.
- **API Changes:** None.
- **Tests:** Semua alur *Customer* (Login -> Cari -> Pesan -> Bayar -> Ulasan).
- **Acceptance Criteria:** 100% dari *happy-path core business logic* lulus tes E2E.
- **Security Checks:** Pengujian otorisasi (akses file/halaman terlarang).

---

## Phase 12 — Security Hardening
- **Objective:** Menerapkan pembatasan dan pengetatan tingkat akhir (*production-grade*).
- **Files/Components:** *Middleware* tingkat lanjut, konfigurasi Vercel/Nginx.
- **Dependencies:** *Upstash/Redis* (Untuk *Rate Limiting* jika menggunakan Vercel).
- **Database Changes:** None.
- **API Changes:** Pembatasan akses *Rate Limit* HTTP `429`.
- **Tests:** Uji beban (*Load testing/spam*) pada *endpoint* pendaftaran (*login/register*).
- **Acceptance Criteria:** *Spamming API* menghasilkan respon `429 Too Many Requests`. Pesan error internal disembunyikan (*Error disclosure prevention*).
- **Security Checks:** Verifikasi *CORS, HSTS*, dan parameter batas memori per unggahan (*Max Payload Size*).

---

## Phase 13 — Performance
- **Objective:** Mengoptimalkan waktu muat aplikasi (*Load Time*) dan SEO.
- **Files/Components:** `next/image`, *Metadata* SSR.
- **Dependencies:** None.
- **Database Changes:** Penambahan *Indexes* pada tabel (jika ditemukan *query* berat setelah pengujian).
- **API Changes:** Mengimplementasikan *Caching Header* (Misal: SWR, `revalidate`).
- **Tests:** *Lighthouse CI/Performance test*.
- **Acceptance Criteria:** Skor Lighthouse hijau (>90) untuk *Performance, Accessibility, SEO, Best Practices*. Transisi gambar mobil cepat tanpa kedipan (*layout shift*).
- **Security Checks:** Konfigurasi *Cache* tidak menyisakan/menyimpan cache informasi privat pelanggan (*sensitive caching*).

---

## Phase 14 — Deployment
- **Objective:** Peluncuran aplikasi ke ranah *Production*.
- **Files/Components:** CI/CD YAML, konfigurasi DNS, Dasbor layanan *hosting*.
- **Dependencies:** Vercel (Frontend), Supabase/Neon (Database).
- **Database Changes:** Pembuatan instance *Database Production*, menjalankan *seed* data kategori awal.
- **API Changes:** Menyesuaikan URL API utama dan *Callback* ke domain resmi (e.g. `https://www.rental-mobil.com`).
- **Tests:** *Smoke test* pasca perilisan di peladen (*server*) sesungguhnya.
- **Acceptance Criteria:** Pengguna sungguhan dapat mengakses, membuat akun, dan memanipulasi *booking* tanpa kendala, dan memproses *payment gateway* *live*.
- **Security Checks:** Seluruh kunci percobaan (*sandbox keys*) diganti dengan *Live Keys*. *Database Firewall* diaktifkan.
