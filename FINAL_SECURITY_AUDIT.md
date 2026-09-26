# FINAL SECURITY AUDIT

## Executive Summary
Audit keamanan akhir ini dilakukan menggunakan pendekatan _static analysis_ dan penelusuran arsitektur API secara komprehensif. Secara keseluruhan, sistem memiliki fondasi keamanan yang kuat:
- Autentikasi dan otorisasi (RBAC) diimplementasikan dengan baik menggunakan NextAuth dan pengecekan sesi di level Server Actions.
- Tidak ditemukan celah XSS berkat *default output encoding* React dan validasi *zod*.
- Terlindung dari SQL Injection karena menggunakan Prisma ORM.
- IDOR pada fitur utama pengguna telah dicegah dengan validasi `userId === session.user.id`.

Namun, ditemukan beberapa kerentanan pada logika bisnis, *error handling*, dan konfigurasi Next.js yang memerlukan perbaikan sebelum *production release*.

---

## Security Findings

### 1. Missing Rate Limiting on Authentication Endpoint
- **Severity**: High
- **Location**: `src/lib/auth.ts` (NextAuth Credentials Provider) / Endpoint: `POST /api/auth/callback/credentials`
- **Problem**: Berbeda dengan endpoint registrasi yang sudah dilindungi _Rate Limiter_, endpoint login (NextAuth) tidak memiliki batasan jumlah *request*.
- **Attack Scenario**: Penyerang dapat melakukan *Brute Force* atau *Credential Stuffing* dengan mengirimkan ribuan percobaan *login* tanpa diblokir oleh sistem.
- **Remediation**: Implementasikan fungsi *rate limit* (memanfaatkan In-Memory Map yang sudah ada di `src/lib/rate-limit.ts`) di dalam fungsi `authorize` pada NextAuth, atau terapkan *rate limiting* di Edge Middleware yang secara spesifik menargetkan path `/api/auth/callback/credentials`.
- **Verification**: Tulis skrip otomatisasi untuk melakukan 100 request login beruntun; pastikan request ditolak (HTTP 429) setelah melewati batas wajar (misal 5 request per menit).
- **Confidence**: Confirmed

### 2. Business Logic / Booking State Manipulation via Admin
- **Severity**: Medium
- **Location**: `src/server/actions/admin.ts` -> fungsi `updateBookingStatus`
- **Problem**: Admin dapat mengubah status pesanan menjadi `CONFIRMED` atau `ONGOING` secara sepihak tanpa melalui validasi bentrok tanggal (overlapping dates).
- **Attack Scenario**: Seorang admin atau staf keliru mengkonfirmasi pesanan yang tanggal sewanya bertabrakan dengan pesanan lain yang sudah `CONFIRMED`. Hal ini memicu *Double Booking* untuk satu kendaraan yang sama.
- **Remediation**: Integrasikan logika pengecekan *overlapping dates* (seperti pada fungsi `createBooking`) ke dalam fungsi `updateBookingStatus`. Tolak transisi status jika kendaraan tidak tersedia di rentang waktu tersebut.
- **Verification**: Lakukan bypass UI, lalu gunakan Server Action secara langsung untuk mengubah status pesanan yang bentrok menjadi `CONFIRMED`. Pastikan fungsi mengembalikan *Error*.
- **Confidence**: High

### 3. Overly Permissive Image Optimization Configuration (Potential SSRF/Bandwidth Abuse)
- **Severity**: Low
- **Location**: `next.config.ts` -> blok konfigurasi `images.remotePatterns`
- **Problem**: Aturan `hostname: "**"` mengizinkan Next.js Image Optimization untuk mengunduh dan mengoptimasi gambar dari domain mana saja di internet.
- **Attack Scenario**: Penyerang menyisipkan URL gambar dari *internal network* atau server berukuran sangat besar. Next.js server akan mengunduh gambar tersebut, yang berpotensi menjadi celah SSRF (*Server-Side Request Forgery*) atau menguras *bandwidth*/*CPU* server (Denial of Service).
- **Remediation**: Batasi `hostname` hanya ke domain *AWS S3 bucket* atau *mock-url* yang digunakan oleh aplikasi (misal: `*.amazonaws.com` atau domain spesifik). Hapus konfigurasi wildcard `**`.
- **Verification**: Lakukan pemuatan gambar Next.js (path `/_next/image`) dengan query URL sembarang domain eksternal. Pastikan server menolak request tersebut dengan HTTP 400.
- **Confidence**: Confirmed

### 4. Information Disclosure via Generic Error Rethrowing
- **Severity**: Low
- **Location**: `src/server/actions/booking.ts` -> fungsi `createBooking` (blok `catch`)
- **Problem**: Ketika menangkap error, kode mengeksekusi `throw new Error(error.message)`. Jika error berasal dari _PrismaClientKnownRequestError_ (misal: kegagalan koneksi database atau _constraint_), pesan internal database akan diekspos langsung ke klien.
- **Attack Scenario**: Penyerang dengan sengaja mengirim *payload* yang memicu pelanggaran *foreign key* atau *timeout*. Aplikasi akan merespons dengan pesan error Prisma yang mengungkapkan struktur skema atau nama tabel database internal.
- **Remediation**: Petakan error menggunakan pengecekan tipe (misal: `instanceof PrismaClientKnownRequestError`). Untuk error yang tidak dikenali atau bersifat sistem, kembalikan pesan generik seperti *"Gagal memproses permintaan, silakan coba lagi"*. Jangan pernah meneruskan `error.message` secara membabi buta.
- **Verification**: Matikan database lokal, lalu coba buat pesanan. Pastikan *error message* yang dikembalikan klien hanyalah pesan generik, bukan log kegagalan koneksi Prisma.
- **Confidence**: Confirmed

---

## Positive Security Controls
- ✅ **SQL Injection**: Tidak ada kerentanan. Seluruh interaksi database di-*handle* oleh Prisma ORM dengan *parameterized queries*.
- ✅ **XSS (Cross-Site Scripting)**: Aman. React secara otomatis menangani *encoding*, dan *field* rentan seperti `comment` di-sanitasi secara eksplisit (mengonversi `<` dan `>`).
- ✅ **IDOR (Insecure Direct Object Reference)**: Otorisasi *endpoint* pengguna (`getCustomerBookings`, `cancelBooking`, `createPaymentIntent`) memvalidasi `booking.userId === session.user.id` secara ketat.
- ✅ **Mass Assignment**: Aman. Input di-binding dan divalidasi sangat ketat menggunakan schema *Zod* tanpa mengizinkan injeksi *field* sensitif seperti `role` pengguna.
- ✅ **Security Headers**: Terkonfigurasi dengan baik di `next.config.ts` (menggunakan strict transport security, no-sniff, dan frame-options).
- ✅ **Price Manipulation**: Harga dihitung di level server (*Server-Side Pricing*) berdasarkan durasi hari dan harga per hari dari database, sehingga manipulasi *payload* harga total dari *client* tidak akan berdampak.

---

## Recommended Action
Tinjau kembali keempat temuan (Findings) di atas. Jika tim setuju, lakukan perbaikan (Remediation) berdasarkan prioritas sebelum versi ini masuk ke tahap rilis produksi.
