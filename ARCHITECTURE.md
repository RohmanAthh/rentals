# Architecture Design: Car Rental Application

Dokumen ini mendefinisikan arsitektur perangkat lunak untuk aplikasi web Rental Mobil skala *production* menggunakan *stack* Next.js, PostgreSQL, Prisma, Auth.js, Zod, dan S3.

---

## 1. Application Architecture

Aplikasi ini menggunakan arsitektur **Serverless Monolith** berbasis Next.js (App Router). *Frontend* dan *Backend* berada dalam satu *codebase* (repository tunggal). 
- **Responsibility:** Menyediakan *user interface* yang cepat, *SEO-friendly*, serta memproses logika bisnis terpusat.
- **Dependency:** Next.js framework, Vercel/Node.js Runtime.
- **Security Consideration:** Batasan yang jelas harus dijaga antara kode yang berjalan di *Client* (browser) dan *Server* untuk mencegah kebocoran *secret keys*.

## 2. Folder Structure

Struktur direktori didesain untuk skalabilitas dan pemisahan *concern* (Separation of Concerns).

```text
/
├── prisma/                 # Skema database dan file migrasi
├── src/
│   ├── app/                # Next.js App Router (Routing, Pages, Layouts)
│   │   ├── (public)/       # Halaman publik (Beranda, Cari Mobil, Detail)
│   │   ├── (customer)/     # Halaman khusus Customer (Dashboard, Riwayat)
│   │   ├── admin/          # Halaman Admin (Manajemen Armada, Booking)
│   │   └── api/            # REST API Route Handlers (Webhook eksternal)
│   ├── components/         # Reusable React components (UI primitives & features)
│   ├── lib/                # Konfigurasi utilitas pihak ketiga (Prisma, S3 client)
│   ├── server/             # Logika backend murni (Aman dari kebocoran client)
│   │   ├── actions/        # Next.js Server Actions (Mutasi data)
│   │   └── queries/        # Fungsi akses data/Database Select
│   ├── types/              # Definisi TypeScript
│   └── validations/        # Skema Zod untuk validasi
└── tests/                  # File konfigurasi Playwright & Vitest
```

## 3. Frontend Architecture

- **Responsibility:** Menampilkan UI, merender data statis/dinamis, dan menangani interaksi pengguna.
- **Pola Desain:** *React Server Components* (RSC) digunakan secara *default* untuk *data-fetching* yang aman dan optimal. *Client Components* (`"use client"`) hanya digunakan untuk komponen interaktif (seperti *Date Picker*, *Maps*, atau *Form* dengan *state*).
- **Input:** Interaksi user (klik, form input), parameter URL.
- **Output:** HTML statis/dinamis, respons visual.
- **Dependency:** React, TailwindCSS, komponen UI (misal: shadcn/ui).
- **Security Consideration:** Mencegah XSS (React secara *default* melakukan *escaping*), tidak menyimpan data sensitif di *local storage*.

## 4. Backend Architecture

- **Responsibility:** Memproses logika bisnis (validasi ketersediaan mobil, kalkulasi harga, pemrosesan pembayaran).
- **Pola Desain:** Dipisahkan menjadi `queries` (hanya membaca data) dan `actions` (mengubah data).
- **Input:** Request dari komponen UI, *payload* API eksternal.
- **Output:** Respons sukses/gagal, data JSON ke komponen.
- **Dependency:** Node.js Runtime.
- **Security Consideration:** Semua eksekusi *backend* harus selalu berasumsi input dari klien telah dimanipulasi (Zero Trust).

## 5. API Architecture

- **Server Actions:** Digunakan untuk komunikasi internal (Frontend ke Backend). Bertanggung jawab atas mutasi (Create, Update, Delete).
- **Route Handlers (`/api/...`):** Digunakan *hanya* untuk integrasi eksternal.
- **Responsibility:** Menjembatani sistem luar dengan sistem internal.
- **Input:** Webhook HTTP (misalnya dari Payment Gateway).
- **Output:** JSON / Status HTTP.
- **Dependency:** Next.js Route Handlers.
- **Security Consideration:** Route handlers publik (seperti webhook) harus memvalidasi HMAC/Signature untuk memastikan request benar-benar datang dari *Payment Gateway*.

## 6. Database Layer

- **Responsibility:** Menyimpan dan mengelola persistensi data secara transaksional (ACID).
- **Desain:** PostgreSQL diakses sepenuhnya melalui Prisma ORM.
- **Input:** Prisma Client Queries.
- **Output:** Data relasional.
- **Dependency:** PostgreSQL, Prisma.
- **Security Consideration:** Mencegah SQL Injection (Prisma menggunakan *parameterized queries*). Transaksi konkuren (misal: dua orang mem-booking mobil yang sama di detik yang sama) harus ditangani dengan *database locks* atau validasi *overlapping date* secara ketat.

## 7. Authentication Layer

- **Responsibility:** Mengidentifikasi siapa pengguna yang mengakses aplikasi.
- **Desain:** Menggunakan NextAuth.js dengan strategi sesi berbasis *Database* (untuk kontrol yang lebih kuat atas sesi yang aktif) atau JWT.
- **Input:** Kredensial login atau token OAuth (Google).
- **Output:** Objek *Session* berisi User ID dan Role.
- **Dependency:** NextAuth.js.
- **Security Consideration:** Mengamankan *cookies* (HttpOnly, Secure, SameSite), perlindungan terhadap serangan *Brute Force*.

## 8. Authorization & Role-Based Access Control (RBAC)

Didefinisikan dua role utama:

1.  **CUSTOMER:** 
    *   *Responsibility:* Dapat mencari mobil, membuat *booking*, membayar, dan melihat riwayat transaksinya sendiri.
    *   *Security Consideration:* Isolasi Data (Tenant/User Isolation). *Customer A* tidak boleh bisa mengakses ID booking *Customer B* melalui manipulasi URL.
2.  **ADMIN:** 
    *   *Responsibility:* Mengelola data master (tambah/hapus mobil), mengubah status pemesanan, melihat laporan seluruh transaksi, membatalkan booking, mengelola pengguna.
    *   *Security Consideration:* Halaman dan *Server Actions* untuk Admin harus di-blokir pada tingkat *middleware* dan tingkat eksekusi jika *role session* bukan `ADMIN`.

*(Opsional Role Kedepan: **STAFF/DRIVER** - Dapat melihat jadwal penjemputan namun tidak memiliki akses ke laporan keuangan perusahaan).*

- **Responsibility Layer:** Menentukan *apakah* pengguna yang telah terautentikasi memiliki izin untuk melakukan aksi tertentu.
- **Implementasi:** Pengecekan otorisasi di dalam Middleware (untuk memblokir navigasi halaman) dan di dalam setiap *Server Action* (untuk memblokir mutasi ilegal).

## 9. File & Image Storage

- **Responsibility:** Menyimpan *assets* berukuran besar (Foto Mobil, Bukti Bayar, KTP Pengguna).
- **Desain:** AWS S3 (atau alternatif compatible).
- **Alur (Input/Output):** Klien meminta *Pre-signed URL* ke Backend -> Backend memvalidasi hak akses dan memberikan URL aman berbatas waktu -> Klien mengunggah file *langsung* ke S3.
- **Dependency:** `@aws-sdk/client-s3`.
- **Security Consideration:** *Bucket* penyimpanan tidak boleh bersifat publik *write*. File KTP/SIM bersifat sensitif (PII - *Personally Identifiable Information*), sehingga URL pembacaan gambar harus diproteksi dan berbatas waktu.

## 10. Error Handling

- **Responsibility:** Menangani kegagalan sistem agar aplikasi tidak *crash* total dan memberikan pesan yang jelas kepada pengguna.
- **Desain:** 
    - *Frontend:* Menggunakan file `error.tsx` bawaan Next.js sebagai *Error Boundary* untuk merender UI fallback.
    - *Backend:* Mengembalikan format standar `ActionResponse` (contoh: `{ success: false, message: "Mobil tidak tersedia" }`) alih-alih melempar exception mentah yang menampilkan baris kode internal.

## 11. Logging & Monitoring

- **Responsibility:** Mencatat kejadian di server untuk proses audit dan *debugging*.
- **Input:** *Exceptions*, akses mencurigakan, perubahan status kritis (booking berhasil/dibatalkan).
- **Output:** Log berformat JSON atau notifikasi ke alat *monitoring*.
- **Dependency:** Sentry (untuk menangkap *unhandled exceptions*).
- **Security Consideration:** **JANGAN PERNAH** mencatat informasi sensitif seperti *password*, *token/API Keys*, atau informasi kartu kredit ke dalam sistem log.

## 12. Configuration Management

- **Responsibility:** Mengatur variabel *environment* untuk tahap *development*, *staging*, dan *production*.
- **Desain:** Menggunakan library seperti `@t3-oss/env-nextjs` untuk memastikan semua `process.env` tervalidasi pada saat server mulai berjalan (startup). Aplikasi akan langsung *crash/fail fast* jika ada token konfigurasi yang kurang.

## 13. Validation

- **Responsibility:** Memastikan data yang masuk sesuai dengan skema dan tipe yang diharapkan.
- **Desain:** Zod sebagai *Single Source of Truth*.
- **Input:** Data form dari pengguna atau respon API eksternal.
- **Output:** Data tersanitasi (Type-safe) atau *Error Object*.
- **Dependency:** Zod, React Hook Form (dengan Zod Resolver).
- **Security Consideration:** Validasi harus **selalu ganda**. Walaupun *frontend* telah memvalidasi form, **Backend (Server Actions) wajib memvalidasi ulang** data yang sama sebelum menyentuh *database* untuk menghindari *API bypass*.

## 14. Security Boundaries

-   **Layer 1 (Edge/Middleware):** Menahan request jahat dasar, routing otorisasi kasar (mengembalikan 401/403 jika tidak memiliki sesi).
-   **Layer 2 (Validasi Input):** Zod membersihkan dan menjamin semua input berformat benar (mengembalikan 400 Bad Request jika gagal).
-   **Layer 3 (Server Actions Otorisasi):** Mengecek apakah ID entitas yang sedang diubah benar-benar milik pengguna yang sedang memanggil *action* tersebut (IDOR Prevention).
-   **Layer 4 (Database):** Prisma Orm menjaga tipe data dan mencegah SQL Injection pada layer terdalam.
