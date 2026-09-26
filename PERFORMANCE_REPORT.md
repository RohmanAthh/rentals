# PERFORMANCE REVIEW

## Performance Context
Laporan kinerja ini disusun berdasarkan analisis statis terhadap arsitektur Next.js (App Router), Server Actions, dan skema database Prisma. Tinjauan dilakukan secara menyeluruh tanpa mengandalkan optimasi prematur, melainkan berfokus pada potensi kebocoran sumber daya, inefisiensi kueri database, dan penghalang *caching*.

## Architecture
- **Frontend**: Next.js 16 (App Router), Server Components, Tailwind CSS, `next/image`.
- **Backend**: Next.js Server Actions.
- **Database**: PostgreSQL (diakses melalui Prisma ORM).

---

## Findings

### 1. In-Memory JavaScript Aggregation for Dashboard Chart
- **Severity**: High
- **Location**: `src/server/actions/admin.ts` -> fungsi `getDashboardStats()`
- **Evidence**: 
  ```typescript
  db.booking.findMany({
    where: { status: { in: ["CONFIRMED", "ONGOING", "COMPLETED"] } },
    select: { createdAt: true, totalPrice: true },
    orderBy: { createdAt: 'asc' }
  })
  ```
  Kemudian data diproses dengan array `.forEach` untuk di-grup per hari.
- **Bottleneck**: Memuat seluruh data transaksi sukses ke dalam memori aplikasi Node.js secara serentak.
- **Impact**: Seiring bertambahnya transaksi, penggunaan memori (RAM) server akan membengkak, menyebabkan `Out of Memory` (OOM) dan jeda latensi API yang signifikan saat Admin membuka dashboard.
- **Recommendation**: Lakukan agregasi dan pengelompokan langsung di Database. Prisma saat ini belum mendukung konversi `DATE(createdAt)` di dalam `groupBy` secara mudah. Disarankan untuk menggunakan `$queryRaw` SQL murni untuk agregasi ini.
- **Verification**: Profiling alokasi memori pada eksekusi fungsi setelah 100.000 pesanan disimulasi.
- **Confidence**: Confirmed

### 2. Missing Pagination on List Endpoints
- **Severity**: High
- **Location**: `src/server/actions/admin.ts` (`getAllBookings`) dan `src/server/actions/vehicle.ts` (`getVehicles`)
- **Evidence**: Kueri menggunakan `db.booking.findMany()` dan `db.vehicle.findMany()` tanpa argumen `skip` dan `take`.
- **Bottleneck**: Waktu unduh muatan JSON (Payload) dan beban kerja kueri database (tanpa batas ukuran kembalian).
- **Impact**: Aplikasi akan melambat drastis setelah memiliki ribuan baris kendaraan/pesanan. HTML *Response* dan memori *browser* akan terbebani akibat *render* DOM yang sangat besar.
- **Recommendation**: Terapkan logika paginasi (*Offset* atau *Cursor-based*) di API dan *Lazy Loading* (misal: tombol "Muat Lebih Banyak" atau *Infinite Scroll*) di sisi Frontend.
- **Verification**: Tinjau besar payload pada Network tab browser (harus konsisten pada limit maksimal misal 20 item per request).
- **Confidence**: Confirmed

### 3. Force-Dynamic Prevents Static Optimization & Edge Caching
- **Severity**: Medium
- **Location**: `src/app/page.tsx` & `src/app/vehicles/[id]/page.tsx`
- **Evidence**: Deklarasi `export const dynamic = "force-dynamic"`.
- **Bottleneck**: Node.js *Server Rendering* per siklus kunjungan dan kueri database real-time tak berbatas.
- **Impact**: Halaman katalog dan detail mobil di-render ulang (*server-side rendered*) setiap kali diakses. Hal ini meningkatkan beban CPU server dan menghapus manfaat Next.js Data Cache dan Full Route Cache.
- **Recommendation**: Hapus baris `force-dynamic`. Sebagai gantinya, implementasikan *Incremental Static Regeneration* (ISR) dengan menetapkan `export const revalidate = 60` (di-cache per menit) agar halaman dirender secara statis dan meminimalisir kueri ke basis data untuk pengunjung publik.
- **Verification**: Lakukan *build* dan pastikan rute tersebut berubah menjadi ISG (`●`) alih-alih Dynamic (`ƒ`), lalu uji beban dengan ratusan *concurrent requests*.
- **Confidence**: Confirmed

### 4. Missing Indexes on Frequently Filtered Fields
- **Severity**: Medium
- **Location**: `prisma/schema.prisma` (Tabel `Booking` dan `Vehicle`)
- **Evidence**: Kueri intensif menggunakan `where: { status: { in: [...] } }` pada pesanan dan `where: { deletedAt: null }` pada kendaraan, tanpa dukungan indeks basis data.
- **Bottleneck**: PostgreSQL Full Table Scans.
- **Impact**: Waktu pencarian (`Query execution time`) berlipat ganda secara linier O(N) dengan jumlah baris tabel.
- **Recommendation**: Tambahkan indeks baru ke skema Prisma:
  - `@@index([status, createdAt])` pada model `Booking`.
  - `@@index([deletedAt])` pada model `Vehicle`.
- **Verification**: Jalankan kueri `EXPLAIN ANALYZE` di PostgreSQL dan pastikan kueri mengandalkan `Index Scan` alih-alih `Seq Scan`.
- **Confidence**: High

### 5. Missing LCP Image Priority on Frontend
- **Severity**: Low
- **Location**: `src/app/page.tsx`
- **Evidence**: `next/image` di dalam loop `.map()` me-render semua gambar tanpa properti `priority`.
- **Bottleneck**: Keterlambatan unduhan gambar pahlawan/utama (Hero image).
- **Impact**: Memperburuk nilai metrik web inti (*Core Web Vitals*: Largest Contentful Paint / LCP). Browser menunda pengunduhan gambar terbesar di layar sampai JavaScript React selesai di-parse.
- **Recommendation**: Tambahkan atribut `priority={index === 0}` (atau untuk 3 iterasi pertama) di dalam `.map()` agar browser dapat melakukan *preload* HTTP.
- **Verification**: Tinjau panel *Lighthouse* dan perhatikan berkurangnya waktu pemuatan LCP.
- **Confidence**: Confirmed

---

## Positive Findings
- ✅ **Optimal Booking Search Index**: Indeks `idx_bookings_vehicle_dates` dirancang dengan brilian (kombinasi `vehicleId`, `startDate`, `endDate`) untuk mengeksekusi pengecekan *overlap* jadwal kendaraan secara super cepat O(log N).
- ✅ **No Client-Side N+1 Requests**: Data berelasi dijemput seketika di *server* (contoh: `include: { vehicle: true }`), mentransmisikan *payload* yang ringkas langsung ke halaman tanpa mewajibkan komponen melakukan kueri API anak-ke-orangtua berantai (N+1 HTTP Requests).
- ✅ **Image Optimization Ready**: Frontend menggunakan komponen `<Image />` Next.js dengan deklarasi lebar dan tinggi pasti (`width={600} height={400}`), efektif mencegah penyakit antarmuka *Cumulative Layout Shift* (CLS).
- ✅ **Connection Pooling Prevention**: Modul `lib/db.ts` dirancang dengan variabel global, mencegah insiden ambruknya batas koneksi database akibat pembuatan *PrismaClient* baru setiap ada *hot-reloading* pada fasa *Development*.

---

## Recommended Optimizations (Action Plan)

1. **Dashboard Aggregation Rewrite**
   - **Affected files**: `src/server/actions/admin.ts`
   - **Implementation**: Hapus kueri `findMany`, gunakan prisma `$queryRaw` dengan fungsi spesifik mesin pangkalan data.
2. **Implement ISR on Catalog**
   - **Affected files**: `src/app/page.tsx`, `src/app/vehicles/[id]/page.tsx`
   - **Implementation**: Hapus `export const dynamic = "force-dynamic"` lalu gantikan dengan `export const revalidate = 60` (atau lebih).
3. **Database Indexing**
   - **Affected files**: `prisma/schema.prisma`
   - **Implementation**: Tambahkan direktif indeks (`@@index`) pada `status` pesanan dan `deletedAt` kendaraan. Setelah itu jalankan `npx prisma db push`.
4. **Endpoint Pagination**
   - **Affected files**: Keseluruhan Action di `admin.ts` & `vehicle.ts`.
   - **Implementation**: Integrasikan argumen `cursor` atau `skip`/`take`. Implementasikan navigasi perhalaman di komponen tabel Frontend.
