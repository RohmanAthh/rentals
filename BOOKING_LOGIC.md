# Logika Bisnis: Booking & Availability (Sistem Rental Mobil)

Dokumen ini mendefinisikan aturan bisnis (*business rules*) secara komprehensif terkait pemesanan (*booking*) dan ketersediaan (*availability*) kendaraan.

---

## 1. Definisi Entitas & Aturan Waktu

### 1. Vehicle Availability (Ketersediaan Kendaraan)
Ketersediaan sebuah kendaraan tidak ditentukan oleh satu status tunggal ("Tersedia" atau "Tidak Tersedia"). Sebuah kendaraan dianggap **Tersedia (Available)** pada suatu rentang tanggal jika dan hanya jika:
1. Status fisik kendaraan di master data adalah `AVAILABLE` (bukan sedang `MAINTENANCE` atau `RETIRED`).
2. **TIDAK ADA** *booking* aktif (status `PENDING`, `CONFIRMED`, atau `ONGOING`) pada kendaraan tersebut yang rentang waktunya (*start_date* hingga *end_date*) bersinggungan (*overlap*) dengan tanggal yang diminta oleh *customer*.

### 2. Rental Start Date (Tanggal Mulai Sewa)
- Harus berupa tanggal dan waktu di masa depan.
- Tidak boleh berada di masa lalu.
- *Grace period/Advance notice:* Misalnya, *start_date* minimal harus 2 jam dari waktu *booking* dibuat agar pihak rental memiliki waktu persiapan kendaraan.

### 3. Rental End Date (Tanggal Selesai Sewa)
- Harus secara logis terjadi **setelah** *Rental Start Date*.

### 4. Date Overlap (Tumpang Tindih Tanggal)
Dua *booking* (Booking A dan Booking B) dianggap *overlap* jika:
`Start_A < End_B` DAN `End_A > Start_B`
Jika aturan di atas terpenuhi, maka kedua *booking* tersebut memperebutkan waktu yang sama.

### 5. Minimum Rental Duration
Durasi minimal penyewaan adalah **1 Hari (24 Jam)**. Jika *customer* mengembalikan dalam waktu kurang dari 24 jam, harga sewa tetap dihitung 1 hari penuh.

### 6. Maximum Rental Duration
Durasi maksimal penyewaan dalam 1 kali transaksi dibatasi hingga **30 Hari**. Pemesanan di atas 30 hari memerlukan kontrak terpisah (*Long-term corporate rental*) dan tidak dapat melalui alur *booking* reguler.

---

## 2. Siklus Hidup Transaksi (Status Lifecycle)

### 7. Booking Status
Alur status sebuah *booking* bergerak maju sebagai berikut:
`PENDING` -> `CONFIRMED` -> `ONGOING` -> `COMPLETED`
*(Dengan kemungkinan cabang ke `CANCELLED` atau `REJECTED`)*

### 8. Payment Status
- Saat *booking* dibuat, status pembayaran adalah `PENDING`.
- Jika pembayaran via *Payment Gateway* sukses, status menjadi `PAID`.
- Jika *booking* dibatalkan setelah bayar, status menjadi `REFUNDED` (proses manual atau otomatis).

### 9. Expired Booking (Pemesanan Kedaluwarsa)
- Jika *booking* berada di status `PENDING` dan *Payment Status* masih `PENDING` selama lebih dari **1 Jam (60 Menit)**, sistem secara otomatis mengubah *Booking Status* menjadi `CANCELLED` (Expired). Kendaraan tersebut kembali berstatus *Tersedia* untuk orang lain.

### 10. Confirmed Booking
- *Booking* akan otomatis berubah dari `PENDING` menjadi `CONFIRMED` jika sistem menerima notifikasi pembayaran sukses (`PAID`) dari *Payment Gateway*.

### 11. Rejected Booking
- Admin memiliki hak untuk menolak pesanan (berubah menjadi `REJECTED/CANCELLED`) jika ditemukan anomali (misalnya data KTP palsu, atau mobil tiba-tiba mengalami kerusakan parah sebelum hari-H). Pembayaran yang telah masuk harus di-`REFUNDED`.

### 12. Completed Booking
- Ketika *customer* telah mengembalikan mobil dan Admin melakukan inspeksi akhir tanpa masalah, Admin mengubah status *booking* menjadi `COMPLETED`.

### 13. Cancellation (Pembatalan)
- *Customer* hanya dapat membatalkan pesanan secara mandiri jika statusnya masih `PENDING` atau jika `CONFIRMED` namun waktu *Start Date* masih lebih dari H-1. Pembatalan mendadak mungkin dikenakan *penalty* sesuai kebijakan bisnis.

---

## 3. Aturan Inti Pemesanan

**ATURAN MUTLAK:** *Customer* tidak boleh melakukan *booking* terhadap kendaraan yang memiliki *booking* aktif (berstatus `PENDING`, `CONFIRMED`, atau `ONGOING`) dengan rentang tanggal yang *overlap*.

### Analisis Studi Kasus Overlap

**Kasus:**
- **Booking A (Sudah ada di database, status: CONFIRMED):** 01-10-2026 (Jam 10:00) → 05-10-2026 (Jam 10:00)
- **Booking B (Customer baru mencoba memesan mobil yang sama):** 03-10-2026 (Jam 10:00) → 07-10-2026 (Jam 10:00)

**Analisis Konflik:**
Terdapat konflik (*overlap*) mutlak.
Mari gunakan rumus overlap: `Start_A < End_B` DAN `End_A > Start_B`
- `01-10-2026 < 07-10-2026` (TRUE)
- `05-10-2026 > 03-10-2026` (TRUE)
Karena keduanya TRUE, waktu saling tumpang tindih. Pada tanggal 3, 4, dan 5 Oktober, mobil tersebut dibutuhkan oleh Booking A dan Booking B secara bersamaan. Sistem wajib **MENOLAK** pengajuan Booking B pada tahap validasi.

---

## 4. Analisis Race Condition & Double Booking

### Skenario Race Condition (Double Booking)
Bayangkan dua pengguna, Budi dan Andi, melihat aplikasi secara bersamaan. Keduanya melihat Toyota Avanza kosong pada tanggal `10-10-2026` hingga `12-10-2026`. Keduanya menekan tombol "Bayar/Booking" pada milidetik yang hampir sama. 

Jika sistem hanya mengandalkan pengecekan *SELECT* (Cari apakah jadwal kosong) lalu disusul *INSERT* (Buat pesanan), keduanya akan berhasil melewati *SELECT* karena belum ada data yang di-*INSERT*. Hasilnya: **Double Booking** (Dua orang membayar untuk satu mobil di hari yang sama).

### Solusi Pencegahan oleh Backend dan Database

Untuk mencegah masalah di atas secara *foolproof*, tidak cukup hanya mengandalkan kode di Backend (Node.js). Kita harus memanfaatkan kekuatan Database Layer.

1. **Pencegahan Level Database (Terkuat):**
   Di PostgreSQL, kita mengimplementasikan **Exclusion Constraint** menggunakan `btree_gist` pada tabel `bookings`. 
   Constraint ini berbunyi: "Jangan izinkan data baru masuk ke tabel ini jika `vehicle_id` sama, dan tipe data rentang waktunya (start_date sampai end_date) bersinggungan (&&) dengan data yang statusnya bukan CANCELLED".
   *Dampak:* Ketika Andi dan Budi menekan tombol bersamaan, database akan mengunci (*lock*) *insert* pertama yang masuk. *Insert* kedua secara otomatis akan dilempar (*throw error*) oleh PostgreSQL karena melanggar constraint.

2. **Pencegahan Level Backend (Transaksi ACID):**
   Di backend (Prisma/Next.js), kita akan menangkap (*catch*) *error* dari PostgreSQL tersebut.
   Jika transaksi gagal karena constraint *overlap*, *backend* akan membungkus ulang *error* tersebut dan mengirimkan pesan kepada *user* kedua (misal Andi): *"Mohon maaf, kendaraan ini baru saja dipesan oleh orang lain beberapa detik yang lalu."*

3. **Pencegahan Status PENDING:**
   Untuk mencegah mobil "ditahan" oleh orang iseng, setiap *booking* berstatus `PENDING` (menunggu pembayaran) juga akan membuat mobil menjadi tidak tersedia (*unavailable*). Namun, jika dalam 1 jam tidak dibayar, sebuah tugas latar belakang (*Cron Job* / Serverless Queue) akan membatalkan *booking* tersebut dan mengembalikan status ketersediaan mobil.
