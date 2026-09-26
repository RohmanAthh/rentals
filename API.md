# API Design: Car Rental System

Dokumen ini berisi rancangan REST API untuk aplikasi rental mobil. Sesuai prinsip **Zero Trust**, API tidak pernah mempercayai input dari *frontend*. Semua input wajib divalidasi ketat di sisi server menggunakan Zod. Autentikasi dan Otorisasi dilakukan di setiap *endpoint* sebelum memproses logika bisnis atau database.

---

## 1. AUTHENTICATION (AUTH)

### 1.1 Register
- **URL**: `/api/v1/auth/register`
- **Method**: `POST`
- **Authentication/Authorization**: None
- **Rate Limiting**: Strict (Maksimal 3 percobaan / IP / 15 menit) untuk mencegah *spam* pembuatan akun.
- **Request Body**: `{ email, password, name, phone }`
- **Validation**: `email` valid format, `password` min 8 karakter + kombinasi, `phone` format numerik.
- **Response**: `201 Created` ` { id, email, name }` (Jangan pernah mereturn password/hash).
- **Possible Errors**: `400 Bad Request` (Zod error), `409 Conflict` (Email sudah terdaftar).

### 1.2 Login
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Authentication/Authorization**: None
- **Rate Limiting**: Strict (Maksimal 5 percobaan / IP / 5 menit) untuk mencegah *brute-force attack*.
- **Request Body**: `{ email, password }`
- **Validation**: Input sanitization.
- **Response**: `200 OK` (Set HTTP-only, Secure Cookie untuk sesi) atau `{ token, refreshToken }`.
- **Possible Errors**: `401 Unauthorized` (Kredensial salah). *Hindari memberi tahu spesifik apakah email atau password yang salah*.

### 1.3 Logout
- **URL**: `/api/v1/auth/logout`
- **Method**: `POST`
- **Authentication**: Required (Valid Session)
- **Response**: `200 OK` (Hapus/Invalidasi HTTP-only cookie).

### 1.4 Refresh Session/Token
- **URL**: `/api/v1/auth/refresh`
- **Method**: `POST`
- **Authentication**: Required (Valid Refresh Token / Session)
- **Response**: `200 OK` (Token baru / Perpanjang sesi).
- **Possible Errors**: `401 Unauthorized`, `403 Forbidden` (Token diblokir).

### 1.5 Current User
- **URL**: `/api/v1/auth/me`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: `200 OK` `{ id, email, name, role }`

---

## 2. VEHICLES (Katalog Kendaraan Publik)

### 2.1 List Vehicles
- **URL**: `/api/v1/vehicles`
- **Method**: `GET`
- **Authentication**: None
- **Query Params**: `?category_id=uuid`, `?search=toyota`, `?page=1`, `?limit=10`
- **Validation**: `page` dan `limit` harus angka positif (maksimal 50 untuk mencegah *resource exhaustion*).
- **Response**: `200 OK` `{ data: [...vehicles], meta: { page, totalPages } }`

### 2.2 Vehicle Detail
- **URL**: `/api/v1/vehicles/:id`
- **Method**: `GET`
- **Authentication**: None
- **Validation**: `:id` harus berupa UUID valid.
- **Response**: `200 OK` `{ vehicle, images, category }`
- **Possible Errors**: `404 Not Found` (ID tidak ada atau `deleted_at` terisi).

### 2.3 Vehicle Availability Check
- **URL**: `/api/v1/vehicles/:id/availability`
- **Method**: `GET`
- **Authentication**: None
- **Query Params**: `?start_date=2026-10-01&end_date=2026-10-05`
- **Validation**: `start_date` harus masa depan, `end_date` harus > `start_date`.
- **Response**: `200 OK` `{ available: boolean, reason: "..." }`

---

## 3. CATEGORIES

### 3.1 List Categories
- **URL**: `/api/v1/categories`
- **Method**: `GET`
- **Authentication**: None
- **Response**: `200 OK` `{ data: [...categories] }`

### 3.2 Category Detail
- **URL**: `/api/v1/categories/:id`
- **Method**: `GET`
- **Validation**: `:id` UUID.
- **Response**: `200 OK` `{ category }`

---

## 4. BOOKINGS

### 4.1 Create Booking
- **URL**: `/api/v1/bookings`
- **Method**: `POST`
- **Authentication**: Required (CUSTOMER)
- **Rate Limiting**: Maksimal 2 booking *PENDING* aktif per pengguna.
- **Request Body**: `{ vehicle_id, start_date, end_date }`
- **Validation**: Cek durasi maksimal (30 hari), validasi *overlap* ke DB, *vehicle status* harus AVAILABLE.
- **Response**: `201 Created` `{ booking_id, total_price, status: "PENDING" }`
- **Possible Errors**: `409 Conflict` (Kendaraan tidak tersedia/Double Booking), `400 Bad Request`.

### 4.2 List Bookings (Customer's own bookings)
- **URL**: `/api/v1/bookings`
- **Method**: `GET`
- **Authentication**: Required (CUSTOMER)
- **Authorization**: **HANYA** mengambil data di mana `user_id == session.userId` (Mencegah IDOR).
- **Response**: `200 OK` `{ data: [...bookings] }`

### 4.3 Booking Detail
- **URL**: `/api/v1/bookings/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Authorization**: **IDOR Prevention:** Cek apakah `booking.user_id == session.userId` atau role == ADMIN.
- **Response**: `200 OK` `{ booking, vehicle, payment }`
- **Possible Errors**: `403 Forbidden`, `404 Not Found`.

### 4.4 Cancel Booking
- **URL**: `/api/v1/bookings/:id/cancel`
- **Method**: `POST`
- **Authentication**: Required
- **Authorization**: Hanya pemilik *booking* yang bisa membatalkan (dan jika status masih PENDING atau CONFIRMED H-1).
- **Response**: `200 OK` `{ status: "CANCELLED" }`
- **Possible Errors**: `400 Bad Request` (Tidak bisa membatalkan booking ONGOING).

---

## 5. PAYMENTS

### 5.1 Create Payment Intent
- **URL**: `/api/v1/payments`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**: `{ booking_id, method }`
- **Authorization**: Memastikan `booking_id` milik *current user* dan statusnya `PENDING`.
- **Response**: `201 Created` `{ payment_url_or_token }`

### 5.2 Payment Status (Webhook from Payment Gateway)
- **URL**: `/api/v1/payments/webhook`
- **Method**: `POST`
- **Authentication**: None (via HMAC Signature)
- **Authorization**: Validasi signature/HMAC dari provider pembayaran.
- **Request Body**: Payload spesifik dari Midtrans/Stripe.
- **Response**: `200 OK` (Ack).
- **Security**: Jika signature tidak valid, tolak dengan `403 Forbidden` tanpa memproses DB.

---

## 6. REVIEWS

### 6.1 Create Review
- **URL**: `/api/v1/reviews`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**: `{ booking_id, rating, comment }`
- **Authorization & Validation**: Rating (1-5). Hanya bisa mereview *booking* miliknya sendiri yang berstatus `COMPLETED`. Cek constraint di DB agar 1 booking = 1 review.
- **Response**: `201 Created` `{ review }`

### 6.2 List Reviews (For a vehicle)
- **URL**: `/api/v1/vehicles/:id/reviews`
- **Method**: `GET`
- **Authentication**: None
- **Response**: `200 OK` `{ data: [...reviews], average_rating }`

---

## 7. ADMIN

> **Semua endpoint di bawah `/api/v1/admin/*` memiliki aturan baku:**
> - **Authentication**: Required
> - **Authorization**: Role == `ADMIN`. (Jika bukan Admin, tolak dengan `403 Forbidden` seketika).

### 7.1 Dashboard Statistics
- **URL**: `/api/v1/admin/dashboard`
- **Method**: `GET`
- **Response**: `200 OK` `{ total_revenue, active_bookings, vehicles_in_maintenance }`

### 7.2 Vehicle CRUD
- **Create**: `POST /api/v1/admin/vehicles` (Body: `{ brand, model, license_plate, price_per_day, category_id }`)
- **Update**: `PATCH /api/v1/admin/vehicles/:id`
- **Soft Delete**: `DELETE /api/v1/admin/vehicles/:id` (Hanya update `deleted_at = NOW()`).

### 7.3 Category CRUD
- **Create**: `POST /api/v1/admin/categories` (Body: `{ name, description }`)
- **Delete**: `DELETE /api/v1/admin/categories/:id`

### 7.4 Booking Management
- **List All Bookings**: `GET /api/v1/admin/bookings` (Semua booking tanpa filter user).
- **Update Status**: `PATCH /api/v1/admin/bookings/:id/status` (Body: `{ status: "COMPLETED" }`).

### 7.5 Customer Management
- **List Users**: `GET /api/v1/admin/users`
- **Ban/Suspend User**: `POST /api/v1/admin/users/:id/suspend` (Untuk memblokir *fraudster*).
