# AJAX di Django — Ringkasan Praktis (Markdown)

Berikut jawaban ringkas tapi lengkap untuk tiap poin—menggunakan Django dan JS `fetch` sebagai contoh.

---

## 1) Perbedaan *Synchronous request* vs *Asynchronous request*

**Synchronous (tradisional / full-page)**  
Browser mengirim request → menunggu response → **reload/replace** seluruh halaman.  
**Kelebihan:** sederhana, SEO ramah (HTML penuh).  
**Kekurangan:** lambat karena muat ulang penuh; UX terasa “patah”.

**Asynchronous (AJAX / XHR / `fetch`)**  
JS di halaman mengirim request di belakang layar → menerima data (JSON/HTML parsial) → **update sebagian DOM tanpa reload**.  
**Kelebihan:** lebih cepat, hemat bandwidth, interaktif.  
**Kekurangan:** perlu penanganan state, error, loading, aksesibilitas, dan keamanan di sisi klien.

> Catatan: “async” di sini konteks **browser–frontend**. Django juga mendukung **async views** (ASGI), tetapi itu topik server-side yang berbeda.

---

## 2) Alur kerja AJAX di Django (request–response)

1. **Event UI** (klik/submit) memicu JS (`fetch`/XHR).
2. **JS** mengirim HTTP ke endpoint Django (biasanya REST-like), sertakan **CSRF token** untuk non-GET.
3. **URLConf** → **View**. View memvalidasi data (Form/Serializer), otentikasi/otorisasi, dan menjalankan logika.
4. **View** mengembalikan `JsonResponse` (status 200/4xx/5xx).
5. **JS** menerima JSON → update DOM (tampilkan pesan, redirect, render daftar, dsb).

**Sketsa minimal:**

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("api/login/", views.ajax_login, name="ajax_login"),
]
```

```python
# views.py
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate, login

@require_POST
def ajax_login(request):
    data = json.loads(request.body or "{}")
    user = authenticate(request, username=data.get("username"), password=data.get("password"))
    if user:
        login(request, user)  # set session
        return JsonResponse({"ok": True})
    return JsonResponse({"ok": False, "error": "Invalid credentials"}, status=400)
```

```html
<!-- template.html (cuplikan) -->
{% csrf_token %} <!-- memastikan cookie CSRF tersedia -->
<script>
function getCookie(name){
  return document.cookie
    .split('; ')
    .find(r => r.startsWith(name + '='))
    ?.split('=')[1];
}

async function doLogin(){
  const csrftoken = getCookie('csrftoken'); // kirim header CSRF
  const res = await fetch("{% url 'ajax_login' %}", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "X-CSRFToken": csrftoken
    },
    credentials: "same-origin",
    body: JSON.stringify({username: u.value, password: p.value})
  });
  const data = await res.json();
  if (res.ok && data.ok) location.href = "/dashboard/";
  else showError(data.error || "Login gagal");
}
</script>
```

---

## 3) Keuntungan AJAX dibanding render biasa di Django

- **Performa & Responsivitas:** ambil **hanya data yang berubah** → lebih cepat daripada full reload.
- **UX yang halus:** loading indikator, validasi langsung, infinite scroll, pencarian live.
- **Hemat bandwidth:** kirim/terima JSON kecil, bukan HTML penuh + asset.
- **Arsitektur bersih:** pisahkan **view data** (JSON API) dari **rendering** (JS/templating di klien) → mudah di-scale ke SPA/mini‑SPA.
- **Hampir real-time:** mudah dipadukan dengan polling/WebSocket untuk pembaruan cepat.

> Trade-off: kompleksitas naik; perlu perhatian aksesibilitas/SEO dan keamanan klien–server.

---

## 4) Keamanan AJAX untuk Login & Register di Django

### Transport & Cookie
- **Wajib HTTPS** untuk mencegah pembajakan kredensial.
- Atur cookie sesi:
  ```python
  # settings.py (cuplikan)
  SESSION_COOKIE_SECURE = True
  SESSION_COOKIE_HTTPONLY = True
  SESSION_COOKIE_SAMESITE = "Lax"  # atau "Strict" jika cocok
  CSRF_COOKIE_SECURE = True
  # Jika ingin token tak bisa dibaca JS (opsional, butuh strategi injeksi token via DOM):
  # CSRF_COOKIE_HTTPONLY = True
  ```

### CSRF di AJAX
- Aktifkan `django.middleware.csrf.CsrfViewMiddleware` (default proyek).
- Django menaruh token di cookie **`csrftoken`** (bukan HttpOnly), kirim via header **`X-CSRFToken`** untuk non‑GET.
- Bila memakai `CSRF_COOKIE_HTTPONLY=True`, **jangan baca dari cookie**; sematkan token ke DOM (mis. hidden input dari `{% csrf_token %}`) dan ambil nilainya:
  ```html
  <form id="f">{% csrf_token %}</form>
  <script>
    const csrftoken = document.querySelector('#f input[name=csrfmiddlewaretoken]').value;
  </script>
  ```

### Validasi & Otentikasi
- **Validasi server-side** tetap utama (Form/Serializer). Jangan bergantung pada validasi JS saja.
- Gunakan `authenticate()` dan `login()`; pertimbangkan **rotasi sesi** setelah login.
- **Jangan bocorkan** detail sensitif: gunakan pesan generik pada error login/registrasi.
- **Rate-limiting/throttling**: cegah brute-force (DRF throttling atau middleware kustom).
- **CAPTCHA** (opsional) untuk alur register/login mencurigakan.

### Kebijakan lintas domain & konten
- **CORS:** jika domain berbeda, whitelist ketat (`django-cors-headers`); **jangan** `*` untuk request berkredensial.
- **Content-Type:** terima `application/json` (atau bentuk yang diharapkan) dan tolak yang lain.
- **Method & izin:** batasi ke `POST` (gunakan `@require_POST`), cek `request.user.is_authenticated` untuk endpoint tertentu.
- **XSS:** saat me-render data balik ke DOM, lakukan escaping/sanitasi.

### Observabilitas
- **Logging & audit:** catat percobaan gagal berulang; pantau IP/user‑agent; siapkan alarm.

---

## 5) Dampak AJAX pada User Experience (UX)

- **Lebih cepat terasa:** tanpa reload penuh, interaksi terasa real-time (autocomplete, inline validation).
- **Kontinuitas konteks:** posisi scroll & state form tidak hilang.
- **Umpan balik kaya:** spinner, skeleton, toast; bisa **optimistic UI** dengan rollback bila gagal.
- **Form yang ramah:** validasi per‑field, error inline, cegah submit ganda (disable tombol saat proses).
- **Aksesibilitas:** kelola fokus, gunakan ARIA live region untuk update DOM agar screen reader memahami perubahan.
- **Persistensi state klien:** filter/sort tersimpan lokal → pengalaman “app-like”.

---

## Pola implementasi yang direkomendasikan (ringkas)

- Endpoint Django mengembalikan **JSON** konsisten: `{ ok: boolean, data|errors }` + status HTTP semestinya.
- Buat **helper fetch** di klien yang:
  - otomatis menambahkan `X-CSRFToken`,
  - mem‑parse JSON & melempar exception saat `!res.ok`,
  - menampilkan error yang ramah pengguna.
- Tampilkan **indikator loading**, **debounce** pencarian, dan **disable tombol** saat submit.
- Terapkan **rate-limit** + pesan error generik pada login/register (hindari memberi tahu apakah username ada).
- Uji **aksesibilitas** (fokus, keyboard, aria-live), dan sediakan **fallback** submit biasa jika JS nonaktif.

```js
// helper.js (contoh ringkas)
function getCookie(name){
  return document.cookie.split('; ').find(r=>r.startsWith(name+'='))?.split('=')[1];
}

export async function postJSON(url, payload){
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}
```

---

**Siap dipakai:** Kamu bisa langsung menyalin *snippet* di atas untuk form Login/Register berbasis AJAX, lalu menyesuaikan sesuai kebutuhan proyek Django‑mu.
