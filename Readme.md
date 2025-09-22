# README

## 1. Django `AuthenticationForm`

`AuthenticationForm` adalah **form bawaan Django** yang dipakai untuk proses login.  
Form ini memvalidasi username dan password terhadap model `User` dan otomatis menambahkan validasi penting seperti:

**Kelebihan**

- **Praktis**: Tidak perlu menulis form login manual—sudah ada field `username` dan `password`.
- **Validasi Terpadu**: Mengecek apakah user aktif dan password sesuai.
- **Integrasi Middleware**: Bekerja mulus dengan `django.contrib.auth` (session, login/logout).

**Kekurangan**

- **Terbatas pada field standar**: Hanya username/password default.
- **Kustomisasi UI/field**: Untuk menambah field ekstra (misalnya OTP) perlu subclassing.

---

## 2. Perbedaan Autentikasi dan Otorisasi

- **Autentikasi (Authentication)**: Proses **memastikan identitas** pengguna (contoh: login dengan username/password, OAuth).
- **Otorisasi (Authorization)**: Proses **menentukan hak akses** setelah identitas terverifikasi (contoh: boleh/tidaknya mengakses halaman admin).

**Implementasi di Django**

- **Autentikasi**: Disediakan oleh `django.contrib.auth`. Fungsi `authenticate()` memverifikasi kredensial dan `login()` membuat sesi.
- **Otorisasi**: Menggunakan permission dan group. Decorator seperti `@login_required`, `@permission_required`, atau `request.user.has_perm()` mengontrol akses.

---

## 3. Session vs Cookies untuk Menyimpan State

| Aspek              | Session                                        | Cookies                                                 |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------- |
| Lokasi Penyimpanan | Server (ID session disimpan di browser cookie) | Di browser pengguna (data langsung disimpan di cookie)  |
| Keamanan           | Lebih aman: data di server                     | Data dapat dibaca/dimuat pengguna jika tidak dienkripsi |
| Skalabilitas       | Perlu storage server-side                      | Tidak butuh storage server-side                         |
| Ukuran             | Tidak dibatasi browser                         | Dibatasi ±4 KB per cookie                               |

**Kelebihan Session**

- Data tidak mudah dimodifikasi pengguna.
- Mendukung data besar.

**Kekurangan Session**

- Membutuhkan penyimpanan di server (memori/DB/redis).

**Kelebihan Cookies**

- Ringan, tidak memerlukan penyimpanan server.
- Dapat dipakai lintas request secara langsung.

**Kekurangan Cookies**

- Rentan manipulasi jika tidak di-encode/ditandatangani.
- Terbatas ukuran dan jumlah.

---

## 4. Keamanan Cookies & Penanganan di Django

Cookies **tidak otomatis aman**. Risiko yang perlu diperhatikan:

- **Pencurian Cookie (Session Hijacking)** melalui koneksi tidak terenkripsi.
- **Cross-Site Scripting (XSS)** yang dapat membaca cookie.
- **Cross-Site Request Forgery (CSRF)** bila cookie digunakan untuk autentikasi.

**Cara Django Menangani**

- `SESSION_COOKIE_SECURE = True` untuk mengirim cookie hanya lewat HTTPS.
- `SESSION_COOKIE_HTTPONLY = True` agar tidak bisa diakses JavaScript.
- `CSRF_COOKIE_SECURE` dan middleware CSRF bawaan.
- Penandatanganan (signing) menggunakan `django.core.signing` jika menggunakan cookie-based session (`SignedCookieSession`).

## 5. Cara Implementasi Checklists

## 1️⃣ Fungsi Registrasi, Login, dan Logout

**Tujuan:** Memungkinkan pengguna mendaftar, masuk, dan keluar, sehingga hak akses menyesuaikan status login.

**Langkah Umum**

1. **Registrasi**

   - Sediakan form pendaftaran berisi username, email (opsional), dan password.
   - Gunakan _User model_ bawaan Django atau custom user.
   - Saat form valid, gunakan UserCreationForm untuk add user.

2. **Login**

   - Sediakan form login (bisa menggunakan `AuthenticationForm`).
   - Gunakan fungsi `authenticate()` untuk memeriksa kredensial.
   - Jika berhasil, panggil `login(request, user)` untuk membuat session.

3. **Logout**

   - Gunakan `logout(request)` untuk menghapus session user.
   - Redirect ke halaman publik setelah logout.

4. **Proteksi Halaman**
   - Gunakan `@login_required` pada view yang memerlukan status login.

---

## 2️⃣ Membuat Dua Akun User dengan Tiga Dummy Data Masing-masing

**Tujuan:** Menyiapkan data uji coba di lingkungan lokal.

**Langkah Umum**

1. Memasukkan secara manual melalui system CR di website yang sudah kita buat

## 3️⃣ Menghubungkan Model `Product` dengan `User`

**Tujuan:** Setiap produk memiliki pemilik (user) yang jelas.

**Langkah Umum**

1. Tambahkan field `owner` atau `user` pada model `Product` bertipe `ForeignKey` yang mengacu ke `django.contrib.auth.models.User`.
2. Atur _on_delete_ menjadi `CASCADE` (opsional sesuai kebutuhan).
3. Jalankan migrasi database (`makemigrations` & `migrate`).
4. Saat membuat produk baru, isi field `user` dengan `request.user`.

---

## 4️⃣ Menampilkan Detail User dan Cookie `last_login` di Halaman Utama

**Tujuan:** Memberi personalisasi dan informasi login terakhir.

**Langkah Umum**

1. **Menampilkan Username**

   - Di view, gunakan `request.user` untuk mengakses data user yang sedang login.
   - Di template, tampilkan `{{ request.user.username }}`.

2. **Menerapkan Cookie `last_login`**
   - Django otomatis memperbarui field `last_login` setiap kali user login.
   - Setelah login berhasil, tulis cookie: `response.set_cookie('last_login', str(datetime.datetime.now()))`.
   - Di halaman utama, baca cookie: `request.COOKIES.get('last_login')` dan tampilkan.
