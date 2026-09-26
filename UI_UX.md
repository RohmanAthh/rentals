# UI/UX Design: Aplikasi Rental Mobil

Dokumen ini mendefinisikan *User Journey* dan desain antarmuka untuk Customer dan Admin. Fokus utama adalah pada *usability* (kemudahan penggunaan) dan *accessibility* (aksesibilitas, misal: kontras warna, pembaca layar, navigasi keyboard).

---

## A. CUSTOMER JOURNEY

### 1. Landing Page
- **Purpose:** Menyambut pengguna, membangun kepercayaan, dan mengarahkan langsung ke fitur pencarian utama.
- **Components:** Hero Section dengan latar dinamis, Quick Search Form (Tanggal Mulai, Selesai), USP (*Unique Selling Proposition*), dan Testimoni.
- **States:** Default.
- **Loading State:** Skeleton/shimmer pada hero image saat pertama dimuat.
- **Empty State:** N/A.
- **Error State:** Gagal memuat gambar (tampilkan *fallback image*).
- **Success State:** N/A.
- **Responsive Behavior:** Grid testimoni berubah dari 3 kolom ke 1 kolom.
- **Mobile Behavior:** *Quick Search Form* menempel di bawah (*sticky*) atau berubah menjadi *modal popup* agar mudah dijangkau jempol.

### 2. Browse Vehicles & 3. Search & 4. Filter
*(Digabungkan menjadi satu halaman `Catalog Page`)*
- **Purpose:** Menampilkan daftar mobil dan alat untuk menyaring/mencari mobil spesifik.
- **Components:** Search Bar, Filter Sidebar/Drawer (Harga, Kategori, Transmisi), Sort Dropdown, Vehicle Card (Foto, Nama, Harga, Label Ketersediaan).
- **States:** Default, Filtered.
- **Loading State:** *Skeleton* berupa bentuk kartu kendaraan.
- **Empty State:** Ilustrasi "Mobil tidak ditemukan" dengan tombol "Hapus semua filter".
- **Error State:** Pesan gagal memuat data dengan tombol "Coba Lagi".
- **Success State:** Data terbarui secara instan saat filter diterapkan.
- **Responsive Behavior:** Filter Sidebar menjadi *off-canvas drawer* di tablet.
- **Mobile Behavior:** Kartu mobil menjadi *full-width*. Tombol "Filter" melayang (*Floating Action Button*) yang membuka *bottom sheet*.

### 5. Vehicle Detail
- **Purpose:** Menampilkan informasi lengkap suatu kendaraan sebelum memesan.
- **Components:** Image Gallery/Carousel, Spesifikasi Teknis, Deskripsi, Daftar Ulasan, Call-to-Action (CTA) "Sewa Sekarang".
- **States:** Default, Image Expanded (Fullscreen).
- **Loading State:** *Skeleton* untuk gambar utama dan paragraf spesifikasi.
- **Empty State:** N/A.
- **Error State:** "Mobil tidak ditemukan atau sudah dihapus".
- **Success State:** N/A.
- **Responsive Behavior:** Galeri gambar di kiri, informasi di kanan (Desktop).
- **Mobile Behavior:** Gambar menjadi *slider* sentuh (*swipeable*) di bagian atas, tombol "Sewa Sekarang" bersifat *sticky* di bagian paling bawah layar.

### 6. Select Rental Dates & 7. Check Availability
*(Digabungkan pada komponen Date Picker)*
- **Purpose:** Memilih rentang waktu penyewaan dan memvalidasi ketersediaan mobil secara *real-time*.
- **Components:** Kalender Interaktif (Date Range Picker), Info Ringkasan Harga Sementara.
- **States:** Incomplete selection, Invalid selection (overlap).
- **Loading State:** Animasi *spinner* di atas kalender saat sistem mengecek ketersediaan ke server setiap klik tanggal.
- **Empty State:** N/A.
- **Error State:** Tanggal yang dipilih berwarna abu-abu (*disabled*) atau muncul teks merah "Mobil sudah dipesan pada tanggal tersebut".
- **Success State:** Tanggal yang tersedia tersorot dengan warna primer, tombol "Lanjut Booking" aktif.
- **Responsive Behavior:** Kalender menampilkan 2 bulan sekaligus (Desktop).
- **Mobile Behavior:** Kalender menampilkan 1 bulan bergulir (*scrollable*) vertikal untuk kemudahan *tap*.

### 8. Booking & 9. Booking Confirmation
- **Purpose:** Halaman *checkout* untuk mengumpulkan detail penyewa dan mengonfirmasi ringkasan pesanan sebelum pembayaran.
- **Components:** Form Data Diri (Otomatis terisi jika login), Ringkasan Pesanan (Mobil, Tanggal, Rincian Harga, Pajak), Syarat & Ketentuan.
- **States:** Form Pristine, Form Validating, Form Invalid.
- **Loading State:** Tombol "Konfirmasi" berubah menjadi animasi *loading* saat men-submit data ke server.
- **Empty State:** N/A.
- **Error State:** Pesan *error* pada *field* input spesifik (misal: "Nomor telepon tidak valid"). Notifikasi *toast* jika mobil tiba-tiba diambil orang (Race Condition).
- **Success State:** Terdireksi ke halaman Pembayaran.
- **Responsive Behavior:** Form di kiri, Ringkasan di panel kanan yang bersifat *sticky* (Desktop).
- **Mobile Behavior:** *Layout* vertikal (Form di atas, Ringkasan di bawah).

### 10. Payment
- **Purpose:** Menyelesaikan proses pembayaran via *Payment Gateway*.
- **Components:** Informasi Metode Pembayaran, Instruksi Transfer, QRIS Code, Waktu Hitung Mundur (Countdown Timer).
- **States:** Awaiting Payment, Verifying.
- **Loading State:** Animasi *pulsing* saat menunggu konfirmasi *webhook* dari pihak ketiga.
- **Empty State:** N/A.
- **Error State:** Pesan "Waktu pembayaran habis, booking dibatalkan."
- **Success State:** Halaman sukses besar dengan centang hijau, ucapan terima kasih, dan tombol "Lihat Tiket Booking".
- **Responsive Behavior:** Elemen dipusatkan di tengah layar.
- **Mobile Behavior:** Tata letak fleksibel, angka rekening mudah di-*copy* dengan satu ketukan (keterbacaan teks besar).

### 11. Booking History & 12. Booking Detail
- **Purpose:** Menampilkan daftar transaksi pengguna di masa lalu dan yang sedang berjalan, beserta detail spesifik dari satu transaksi.
- **Components:** Tabs (Berjalan, Selesai, Dibatalkan), Kartu Ringkasan Booking, Status Badge, Halaman Detail (Invoice, Tombol Batal).
- **States:** Default.
- **Loading State:** *Skeleton list* untuk daftar transaksi.
- **Empty State:** Ilustrasi "Belum ada riwayat pesanan" dengan tombol "Cari Mobil".
- **Error State:** Gagal memuat riwayat.
- **Success State:** Sukses membatalkan (*badge* berubah merah `CANCELLED`).
- **Responsive Behavior:** Daftar *booking* berbentuk tabel (Desktop).
- **Mobile Behavior:** Daftar *booking* berbentuk kartu vertikal.

### 13. Review
- **Purpose:** Memberikan umpan balik setelah penyewaan selesai.
- **Components:** Star Rating Selector (1-5), Text Area (Opsional), Tombol Kirim.
- **States:** Unrated.
- **Loading State:** *Spinner* pada tombol Kirim.
- **Empty State:** N/A.
- **Error State:** Pesan "Gagal mengirim ulasan".
- **Success State:** *Toast notification* "Terima kasih atas ulasan Anda" dan kembali ke *History*.
- **Responsive/Mobile Behavior:** Bintang (*Star*) berukuran besar (minimum 44x44px) agar mudah di-tap di perangkat *mobile* (Accessibility).

---

## B. ADMIN JOURNEY

> *Fokus pada Admin difokuskan untuk produktivitas data-entry dan analisis (Desktop-first).*

### 1. Login (Admin)
- **Purpose:** Gerbang masuk khusus karyawan/sistem.
- **Components:** Form Email & Password.
- **Responsive Behavior:** Di tengah layar (*Centered card*).
- **Mobile Behavior:** Sama dengan desktop.

### 2. Dashboard
- **Purpose:** Tinjauan sekilas performa bisnis hari ini.
- **Components:** *Stat Cards* (Pendapatan, Booking Aktif), Grafik Sederhana, Tabel *Recent Bookings*.
- **Loading State:** *Skeleton dashboard*.
- **Empty State:** Tabel *Recent Bookings* kosong: "Belum ada transaksi hari ini".

### 3. Vehicle Management & 4. Category Management
- **Purpose:** Mengelola master data mobil dan kategori.
- **Components:** Data Table (dengan *Pagination, Search*), Modal Form (Tambah/Edit), Tombol *Soft Delete*, Input Upload Gambar.
- **States:** View, Editing, Creating.
- **Loading State:** *Skeleton Table rows*. Progress bar saat upload gambar.
- **Empty State:** "Belum ada kendaraan yang terdaftar. Tambah sekarang."
- **Error State:** Validasi form (misal: "Plat nomor sudah ada").
- **Success State:** *Toast/Snackbar* konfirmasi penyimpanan sukses.
- **Responsive Behavior:** Tabel *full-width* (Desktop).
- **Mobile Behavior:** Tabel bisa di- *scroll* horizontal (namun akses admin sangat direkomendasikan via PC).

### 5. Booking Management
- **Purpose:** Melihat, menyetujui (jika manual), atau membatalkan seluruh transaksi *customer*.
- **Components:** Filterable Data Table (berdasarkan Status, Tanggal), Detail View, Tombol Aksi (Ubah ke COMPLETED / CANCEL).
- **Loading/Empty/Error/Success States:** Sama dengan Master Data.

### 6. Customer Management
- **Purpose:** Melihat daftar pengguna dan mengunci akun pengguna bermasalah (Blacklist).
- **Components:** Data Table, Status Toggle (Active/Suspended).
- **Responsive Behavior:** Fokus pada kepadatan data (banyak baris dalam 1 layar).

### 7. Payment Management
- **Purpose:** Merekonsiliasi pembayaran, memantau *refund*.
- **Components:** Daftar Transaksi Pembayaran, Status Gateway, Tombol "Proses Refund" (jika di- *support* secara manual).

### 8. Reports
- **Purpose:** Ekspor data untuk akuntansi.
- **Components:** *Date Range Filter*, *Summary Chart*, Tombol Ekspor CSV/PDF.
- **Loading State:** Tombol ekspor berubah menjadi indikator persentase (*generating*).
- **Empty State:** "Tidak ada data pada rentang waktu terpilih."
- **Mobile Behavior:** Grafik mungkin disembunyikan di layar kecil, hanya menyisakan tombol Ekspor.

---

## C. Aksesibilitas (Accessibility Guidelines)
- Semua elemen interaktif memiliki `aria-label` yang jelas.
- Navigasi penuh menggunakan *Keyboard* (`Tab` untuk pindah, `Enter` untuk klik).
- Kontras warna teks memenuhi standar WCAG (minimal rasio 4.5:1).
- Ukuran target ketukan (*tap target*) pada *mobile* minimal `44x44px`.
- Fokus visual (*Focus outline*) yang sangat jelas (tidak sekadar *browser default*) saat pengguna bernavigasi menggunakan keyboard.
