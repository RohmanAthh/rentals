# Desain Keamanan (Security Design) Sistem Rental Mobil

Berdasarkan tinjauan keamanan menyeluruh (*security-audit* dan *api-review*), berikut adalah panduan dan implementasi lapisan pertahanan untuk aplikasi rental mobil. Dokumen ini menegakkan prinsip **Zero Trust Architecture**.

---

## 1. ATURAN KEAMANAN MUTLAK (Zero Trust Validation)

Empat kerentanan paling krusial dalam sistem *e-commerce/booking* telah dimitigasi secara eksplisit:

1. **Price Manipulation Prevention:** Klien/Frontend tidak pernah mengirimkan `total_price` ke server saat proses pemesanan. *Backend* akan mengambil `price_per_day` langsung dari tabel `vehicles` pada database yang diamankan, lalu mengalikannya dengan durasi penyewaan di level *server*. Segala harga yang disubmit oleh klien akan diabaikan secara mutlak.
2. **Server-Side Availability Validation:** Ketersediaan mobil tidak boleh hanya dicek via kalender di Frontend. Saat *Backend* menerima permintaan, *Backend* dan Database wajib mengalkulasi ulang secara atomik (dengan PostgreSQL *Exclusion Constraint*) untuk memastikan tidak ada *overlap* atau *race condition*.
3. **IDOR (Insecure Direct Object Reference) Prevention:** Mengganti parameter `/bookings/123` menjadi `/bookings/124` di URL/API tidak akan menampilkan data milik orang lain. Semua kueri pembacaan data privat **wajib** mencantumkan pengecekan kepemilikan (`WHERE booking_id = ? AND user_id = session.userId`).
4. **Server-Side Admin Protection:** Rute administratif tidak sekadar disembunyikan di UI (Frontend). Setiap pemanggilan *API endpoint* atau *Server Action* di *backend* secara mutlak memeriksa objek Sesi (`if (session.user.role !== 'ADMIN') throw Unauthorized`).

---

## 2. Analisis Keamanan 27 Area Sistem

### A. Akses dan Identitas
1. **Authentication:** Menggunakan standar modern (Auth.js) dengan mekanisme *Credential* (Bcrypt) dan/atau OAuth 2.0 (Google).
2. **Authorization:** Pengecekan izin otorisasi diterapkan di level *Route/Middleware* (mencegah navigasi) dan level *Controller/Server Action* (mencegah akses API langsung).
3. **RBAC (Role-Based Access Control):** Di- *hardcode* dan diperiksa secara konstan. *Role* hanya bisa `CUSTOMER` atau `ADMIN`, tersimpan sebagai string di database, bukan disisipkan dari sisi *client*.
4. **Password Security:** Kata sandi di- *hash* menggunakan algoritma modern dan lambat seperti *Bcrypt* dengan *Salt* unik per pengguna (min. 10 *rounds*).
5. **Session/Token Security:** Sesi mengandalkan HTTP-Only, Secure, SameSite=Lax/Strict Cookies untuk mencegah intersepsi XSS. Umur token dibatasi.
6. **Brute Force:** Endpoint `/api/v1/auth/login` dilindungi *rate limiting* yang agresif (maksimal 5 kali percobaan gagal berturut-turut dalam 5 menit sebelum alamat IP dibekukan).

### B. Proteksi Kerentanan Web Standar (OWASP)
7. **CSRF (Cross-Site Request Forgery):** Diatasi dengan arsitektur Next.js (Server Actions secara default memiliki *Host check* / Origin validation) dan penggunaan *SameSite cookie*.
8. **XSS (Cross-Site Scripting):** Murni mengandalkan proteksi bawaan React DOM yang secara otomatis melakukan *escaping/sanitizing* pada setiap variabel sebelum di- *render* ke HTML. Data *Review* dari user tidak akan membahayakan pembaca.
9. **SQL Injection:** Dihindari secara total karena sistem menggunakan ORM (Prisma) yang mem- *parse* argumen menggunakan *Prepared Statements* / *Parameterized Queries*, tidak pernah melakukan penyambungan *string* SQL manual.
10. **Mass Assignment:** Model database tidak diset berdasarkan input mentah. Hanya *fields* spesifik yang diizinkan (*whitelisted*) oleh *Zod schema* yang diteruskan ke ORM untuk diperbarui.

### C. Keamanan File dan Unggahan
11. **File Upload Security:** File KTP/Bukti transfer dikirimkan via pola *Pre-Signed URL*. Klien meminta URL spesifik yang kedaluwarsa dalam 5 menit, lalu melakukan *upload* langsung ke S3 Bucket.
12. **Image Upload:** Hanya memproses unggahan gambar untuk foto kendaraan atau bukti identitas.
13. **MIME Validation:** Server (atau S3) hanya mengizinkan *Content-Type* spesifik: `image/jpeg`, `image/png`, `image/webp`. File dengan eksistensi ganda (e.g. `image.php.jpg`) ditolak.
14. **File Size Validation:** Dibatasi maksimal 5 MB per gambar untuk mencegah eksploitasi *Storage Exhaustion* atau serangan (D)DoS.

### D. Konfigurasi dan Infrastruktur
15. **Environment Secrets:** Token JWT, kunci API Stripe/Midtrans, kunci AWS tidak disimpan dalam kode sumber (*hardcoded*) tetapi diinjeksi via `.env`.
16. **API Secrets:** Semua secret diperiksa validitas keberadaannya saat server dihidupkan (menggunakan `@t3-oss/env-nextjs`). Server tidak akan menyala jika *secret* hilang.
17. **Database Credentials:** Disimpan dalam bentuk URI yang terenkripsi di *environment*, dan akses IP database dibatasi hanya untuk *Vercel instances*.
18. **CORS:** Dibatasi ketat hanya ke *domain* resmi (misal: `https://www.rental-mobil.com`). Endpoint *API Route* menolak permintaan lintas sumber (`Cross-Origin`) secara *default*.
19. **Security Headers:** Aplikasi dikonfigurasikan dengan *headers* pelindung: `Strict-Transport-Security` (HSTS), `X-Frame-Options` (DENY), `X-Content-Type-Options` (nosniff).

### E. Visibilitas dan Transparansi
20. **Logging:** Seluruh aktivitas fatal, kesalahan transaksi, dan *login failure* dikirim ke alat pemantau (*Sentry*).
21. **Error Disclosure:** Pesan *error* internal sistem (misal: "Table 'users' not found" atau jejak direktori *stack trace*) tidak akan terekspos ke klien di tahap *production*. Semua *error* akan dibungkus dengan pesan generik "Terjadi kesalahan pada sistem".

### F. Integritas Transaksi dan Bisnis
22. **Rate Limiting (Umum):** Diterapkan pada pencarian daftar mobil (`/api/v1/vehicles`) dan penciptaan *booking* agar robot *scraper* tidak membebani server dan kompetitor tidak mengunci jadwal kendaraan.
23. **Booking Manipulation:** Pengguna tidak bisa mengubah rentang tanggal atau mobil ketika status *booking* sudah `CONFIRMED` atau `PAID`.
24. **Payment Manipulation:** Konfirmasi apakah pembayaran valid HANYA diterima via *Webhook* server-ke-server terenkripsi (HMAC Signature). Kita tidak akan menganggap status `PAID` hanya karena klien mereturn `success=true` setelah dialihkan.

---
Dokumen ini menjadi spesifikasi mutlak (*baseline*) sebelum koding diimplementasikan. Jika ada kode yang melanggar ketentuan di atas, *Pull Request* atau *commit* harus digagalkan.
