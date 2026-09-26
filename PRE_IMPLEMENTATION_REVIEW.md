# Pre-Implementation Review

Dokumen ini berisi hasil tinjauan menyeluruh (*audit*) lintas disiplin terhadap rancangan arsitektur, database, logika bisnis, keamanan, API, UI/UX, dan rencana pengembangan (*Development Plan*) untuk aplikasi rental mobil.

Tinjauan ini menemukan beberapa celah (*vulnerabilities*), kontradiksi, dan persyaratan yang terlewat yang harus diperbaiki sebelum menulis kode aktual.

---

## 🔴 CRITICAL

### 1. Contradiction: Arsitektur API vs Server Actions (Unnecessary Complexity)
- **Dokumen Terkait:** `ARCHITECTURE.md` vs `API.md`
- **Temuan:** `ARCHITECTURE.md` secara eksplisit merekomendasikan penggunaan **Next.js Server Actions** untuk mutasi internal (*frontend* ke *backend*). Namun, `API.md` merancang secara lengkap *RESTful endpoints* untuk mutasi (contoh: `POST /api/v1/bookings`). 
- **Dampak:** Membangun keduanya (Server Actions untuk antarmuka web, dan *REST endpoint* internal) akan menciptakan redundansi kode, meningkatkan waktu pengembangan 2x lipat, dan memecah lapisan validasi (*surface area*).
- **Catatan:** Harus diputuskan. Jika tidak ada *Mobile App* terpisah, hapus rute REST API internal dan murni gunakan Server Actions. Sisakan *REST Route Handlers* hanya untuk *Webhook Eksternal*.

---

## 🟠 HIGH

### 2. Database ORM Inconsistency: Dukungan Prisma untuk `tstzrange`
- **Dokumen Terkait:** `DATABASE.md` & `BOOKING_LOGIC.md`
- **Temuan:** Strategi jitu untuk mencegah *Double Booking* sangat bergantung pada `EXCLUDE USING gist (tstzrange...)` di PostgreSQL. Namun, **Prisma ORM tidak mendukung tipe data range (`tstzrange`) dan Exclusion Constraints secara *native***. 
- **Dampak:** Jika dipaksakan, kita harus menulis migrasi SQL mentah (*raw SQL*) yang mem- *bypass* skema Prisma, dan tipe data tersebut akan ditandai sebagai `Unsupported("tstzrange")` di `schema.prisma`. Ini akan menyulitkan interaksi *type-safe* ORM.

### 3. Missing Requirement: Endpoint Generate Pre-Signed URL
- **Dokumen Terkait:** `API.md`, `ARCHITECTURE.md`, `SECURITY.md`
- **Temuan:** Strategi *upload* gambar diklaim menggunakan *Pre-signed URL AWS S3* langsung dari klien. Akan tetapi, di `API.md` tidak ada pendefinisian API untuk meminta (meng-*generate*) token/URL *pre-signed* tersebut (misalnya `GET /api/v1/upload/presigned-url`).
- **Dampak:** *Frontend* tidak akan memiliki rute untuk mendapatkan akses unggah ke S3.

### 4. Missing Requirement: Atribut Kendaraan di Database
- **Dokumen Terkait:** `DATABASE.md` vs `UI_UX.md`
- **Temuan:** Tabel `vehicles` hanya memiliki kolom `brand`, `model`, `year`, `license_plate`. Padahal, pada `UI_UX.md`, fitur *Filter* mengandalkan kriteria "Kapasitas Penumpang", "Jenis Transmisi" (Otomatis/Manual), dan "Jenis Bahan Bakar".
- **Dampak:** UI tidak bisa dikembangkan secara utuh karena database kekurangan data spesifikasi mobil yang vital untuk pengalaman pelanggan rental.

### 5. Race Condition: Batas Kedaluwarsa Transaksi vs Webhook
- **Dokumen Terkait:** `BOOKING_LOGIC.md` & `API.md`
- **Temuan:** Aturan logika menyatakan bahwa pesanan kedaluwarsa jika dalam 1 jam tidak dibayar. Jika *Customer* menyelesaikan pembayaran di *Payment Gateway* tepat pada detik ke `59:59`, ada jeda latensi jaringan. *Webhook* sukses masuk pada menit ke `60:05`. 
- **Dampak:** Proses otomatis latar belakang (*Cron job*) mungkin telah membatalkan *booking* (`CANCELLED`) sepersekian detik sebelum *Webhook* (`PAID`) masuk. Uang pelanggan terpotong, tetapi mobil dianggap batal dipesan. Belum ada definisi resolusi untuk konflik ini (*Payment Webhook Fallback*).

---

## 🟡 MEDIUM

### 6. Missing Requirement: Infrastruktur Background Jobs / Cron
- **Dokumen Terkait:** `DEVELOPMENT_PLAN.md` & `ARCHITECTURE.md`
- **Temuan:** Fitur "pembatalan transaksi otomatis setelah 1 jam" membutuhkan sistem eksekusi latar belakang. Namun, infrastruktur *Task Queue* (misal: Redis/BullMQ) atau konfigurasi *Vercel Cron* tidak dimasukkan dalam spesifikasi teknologi dan daftar *dependency*.
- **Dampak:** Mengandalkan fungsi `setTimeout()` bawaan Node.js sangat berbahaya di lingkungan Serverless/Vercel karena proses akan dibekukan (*frozen/killed*) sesaat setelah *response HTTP* selesai dikirim.

### 7. Missing Requirement: Lupa Kata Sandi (Password Reset Flow)
- **Dokumen Terkait:** `UI_UX.md` & `API.md`
- **Temuan:** Tidak ada definisi *User Journey* dan *API endpoint* untuk skenario Lupa Kata Sandi (*Forgot/Reset Password*). 
- **Dampak:** Pelanggan yang melupakan sandi tidak akan bisa mengakses aplikasinya kembali.

---

## 🟢 LOW

### 8. API Inconsistency (RESTful Convention)
- **Dokumen Terkait:** `API.md`
- **Temuan:** Endpoint pembatalan `POST /api/v1/bookings/:id/cancel` bisa dimodelkan dengan lebih RESTful sebagai `PATCH /api/v1/bookings/:id` dengan payload `{ status: 'CANCELLED' }`.

### 9. Unnecessary Complexity: ENUM Metode Pembayaran
- **Dokumen Terkait:** `DATABASE.md`
- **Temuan:** Pembatasan kolom metode pembayaran menjadi `enum method "CREDIT_CARD, TRANSFER, EWALLET"` pada tabel `payments` agak membatasi.
- **Dampak:** Penyedia layanan pembayaran sering meluncurkan metode pembayaran baru (contoh: *Paylater*, *QRIS*, *Virtual Account specific bank*). Daripada memodifikasi skema *enum database* setiap ada pembaruan metode pembayaran, tipe `VARCHAR` konvensional akan lebih fleksibel untuk integrasi pihak ketiga.

---

**STATUS REVIEW:** SELESAI.
> Sesuai dengan instruksi, tidak ada perbaikan otomatis yang dilakukan pada file-file referensi. Temuan di atas harus didiskusikan dan diubah pada dokumen masing-masing sebelum memasuki eksekusi *Phase 1*.
