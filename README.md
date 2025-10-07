# CSS & Responsive Web — Deep-Dive Answers

> Ringkas namun tajam: urutan prioritas CSS (cascade & specificity), pentingnya responsive design, beda margin–border–padding, Flexbox & Grid, serta langkah konkret mengimplementasikannya di proyek.

---

## 1) Jika terdapat beberapa CSS selector untuk suatu elemen, apa urutan prioritasnya?

**Urutan keputusan browser (dari paling kuat):**

1. **Importance**: deklarasi yang diberi `!important` menang atas yang tidak.
   - Urutan importance menurut asal *style* (paling kuat → lemah):
     - **User** `!important` (jarang dipakai, untuk aksesibilitas pembaca).
     - **Author** `!important` (stylesheet aplikasi kamu).
     - **Author** biasa.
     - **User** biasa.
     - **User-Agent** (default bawaan browser).
2. **Cascade Layers** (`@layer`): jika kamu memakai layer, maka **urutan layer** menentukan prioritas di antara stylesheet author **sebelum** menghitung specificity. Layer yang dideklarasikan **belakangan** menang.
3. **Specificity**: dihitung sebagai tuple **(a, b, c, d)**
   - `a`: **Inline style** (atribut `style=""`) → 1 jika ada, selain itu 0.
   - `b`: jumlah **ID selector** (`#header`).
   - `c`: jumlah **class/attribute/pseudo-class** (`.btn`, `[type=button]`, `:hover`, `:focus`, `:nth-child`).
   - `d`: jumlah **element/pseudo-element** (`div`, `h1`, `::before`, `::marker`).
   - Lebih besar di posisi kiri menang; jika sama, bandingkan posisi berikutnya.
4. **Source order**: jika semuanya sama, **deklarasi yang muncul paling akhir** (paling bawah/terakhir ter-load) menang.

**Catatan penting modern CSS:**
- `:where(...)` **tidak menambah specificity** (bagus untuk membuat API komponen yang mudah dioverride).
- `:is(...)` mengambil **specificity tertinggi** dari daftar selektor di dalamnya.
- `:not(...)` **tidak menambah** specificity dari argumennya (hanya 1 pseudo-class).
- Property yang **diwariskan** (*inheritance*) hanya dipakai jika elemen **tidak** memiliki deklarasi sendiri pada properti tersebut.
- `Inline style + !important` hampir tak terkalahkan (kecuali oleh `user !important`).

**Contoh singkat:**
```css
/* Specificity: (0,1,0,1)  -> menang atas  (0,0,2,1) */
#app .card h2 { color: teal; }   

/* (0,0,2,1) */
.card.title h2 { color: tomato; }

/* Layer belakangan override layer awal */
@layer base { .btn { color: black; } }
@layer theme { .btn { color: white; } } /* ini menang karena layer muncul belakangan */
```

---

## 2) Mengapa **responsive design** penting? Contoh yang sudah & belum menerapkan

**Alasan bisnis & teknis:**
- **Multi-device**: layar ponsel → desktop, orientasi portrait/landscape, DPR tinggi (retina).
- **UX & aksesibilitas**: teks dapat dibaca tanpa zoom; kontrol sentuh cukup besar; fokus keyboard jelas.
- **SEO & web-vitals**: Google memprioritaskan situs mobile-friendly; *CLS/LCP/INP* lebih mudah dikendalikan bila layout responsif.
- **Maintainability**: satu basis kode untuk semua ukuran layar; lebih murah daripada memelihara “versi mobile” terpisah.

**Contoh yang sudah responsif (karakteristiknya):**
- **Portal berita/produk modern** (mis. situs berita besar, dokumentasi framework): kolom berita berubah jadi satu kolom, navigasi menjadi hamburger, gambar *fluid* (`max-width: 100%`), grid beradaptasi di breakpoint.

**Contoh yang belum responsif (ciri-cirinya):**
- **Halaman fixed-width lawas** (mis. template 960px era lama): butuh *pinch-zoom* di ponsel, teks terlalu kecil, horizontal scroll muncul, tombol tidak layak tap.

**Elemen kunci implementasi:**
- Tag viewport: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Unit relatif: `%`, `rem`, `vw`, `vh`, `ch`
- Media queries & container queries
- Gambar responsif: `max-width:100%`, `height:auto`, atribut `sizes/srcset` jika perlu

---

## 3) Beda **margin**, **border**, dan **padding** + cara pakai

- **Padding**: ruang **di dalam** kotak, antara **konten** dan **border**. Mendorong isi menjauh dari tepi.
- **Border**: garis yang **mengelilingi** padding dan konten.
- **Margin**: ruang **di luar** border; memisahkan elemen dari elemen lain.

**Kode contoh:**
```css
.card {
  /* Membuat lebar inklusif border & padding */
  box-sizing: border-box;

  padding: 1rem;              /* ruang dalam */
  border: 1px solid #e5e7eb;  /* garis tepi */
  margin: 1.25rem 0;          /* jarak antar card */
  border-radius: .75rem;
}
```

**Catatan yang sering keliru:**
- **Margin collapse**: margin vertical dua blok yang berdempetan bisa “menggabung” (hanya yang terbesar yang terlihat). Hindari kebingungan dengan memberi padding pada kontainer alih-alih margin atas pada anak pertama.
- `box-sizing: border-box` disarankan agar lebar yang ditetapkan **sudah termasuk** padding & border.

---

## 4) **Flexbox** & **Grid** — konsep & kegunaan

### Flexbox (tata letak 1 dimensi)
- Fokus mengatur **deretan** item di satu **axis** (main-axis), lalu menyelaraskan di **cross-axis**.
- Cocok untuk toolbar, navbar, form row, kartu-kartu sebaris, *centering* vertikal/horizontal.

Properti inti (kontainer):
```css
.wrapper {
  display: flex;
  flex-wrap: wrap;           /* biar turun baris saat sempit */
  gap: 1rem;                 /* jarak antar item */
  justify-content: space-between; /* di main-axis */
  align-items: center;       /* di cross-axis */
}
```
Properti pada item: `flex: 1`, `flex-basis`, `flex-grow`, `flex-shrink`, `align-self`.

### CSS Grid (tata letak 2 dimensi)
- Mengatur **baris** dan **kolom** sekaligus. Ideal untuk dashboard, halaman majalah, galeri kompleks.
- Mendukung area bernama, *auto-placement*, dan fr-unit.

Contoh inti:
```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}
.sidebar { grid-column: 1 / span 3; }
.content { grid-column: 4 / span 9; }
@media (max-width: 768px) {
  .sidebar, .content { grid-column: 1 / -1; } /* tumpuk di mobile */
}
```

**Kapan pakai apa?**
- **Flex** untuk penyusunan linier dan distribusi ruang di satu arah.
- **Grid** untuk komposisi 2D (baris+kolom) dan *page layout* yang terstruktur.

---

## 5) Langkah **step‑by‑step** mengimplementasikan checklist di proyek

### A. Menata fondasi CSS
1. **Viewport & reset**  
   Tambahkan meta viewport dan reset ringan/normalize. Atur:  
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```
   ```css
   :root { --gap: 1rem; --radius: .75rem; }
   *,*::before,*::after { box-sizing: border-box; }
   img,video { max-width: 100%; height: auto; }
   ```
2. **Arsitektur stylesheet**  
   Pisahkan file: `layer(base)`, `layer(components)`, `layer(utilities)` menggunakan `@layer` agar override terkontrol.
   ```css
   @layer base, components, utilities;
   @layer base { /* tipografi, warna, spacing scale */ }
   @layer components { /* card, button, form */ }
   @layer utilities { /* helper: .mt-*, .flex-center */ }
   ```

### B. Mengaplikasikan Box Model dengan rapi
3. **Gunakan padding untuk ruang internal** komponen, **margin untuk jarak antar-komponen**. Hindari margin-top pada anak pertama untuk mengelak *margin collapse*:
   ```css
   .section { padding-block: 2rem; }
   .stack > * + * { margin-block-start: 1rem; } /* pola stack */
   ```

### C. Layout responsif dengan Flex & Grid
4. **Kerangka halaman pakai Grid**, konten lokal pakai Flex:
   ```css
   .page {
     display: grid;
     grid-template-columns: 1fr min(100ch, 100%) 1fr;
   }
   .page > * { grid-column: 2; }            /* konten terpusat */
   .header, .footer { grid-column: 1 / -1; }/* full-bleed */
   ```
5. **Komponen responsif** dengan *media/container queries*:
   ```css
   @media (max-width: 768px) {
     .navbar { flex-wrap: wrap; gap: .5rem; }
   }
   ```

### D. Spesifik untuk Form modern
6. **Form field**: padding nyaman, tinggi target sentuh ≥ 44px, label jelas.
   ```css
   .field { display: grid; gap: .5rem; }
   .input {
     padding: .75rem 1rem;
     border: 1px solid #e5e7eb;
     border-radius: var(--radius);
   }
   .input:focus { outline: 2px solid transparent; box-shadow: 0 0 0 3px rgba(16,185,129,.35); }
   ```
7. **Grid untuk kelompok field** (mis. 2 kolom di desktop → 1 kolom di mobile).
   ```css
   .form-grid { display: grid; gap: var(--gap); grid-template-columns: 1fr 1fr; }
   @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
   ```

### E. Menjaga prioritas & override yang sehat
8. **Hindari `!important`** kecuali untuk *utilities*. Manfaatkan `@layer` dan spesifisitas rendah + urutan *source* yang terencana.
9. Jika perlu API komponen yang mudah dioverride, bungkus selector dengan `:where(...)` untuk spesifisitas 0:
   ```css
   :where(.btn) { padding:.625rem 1rem; border-radius: .5rem; }
   .btn--primary { background: #10b981; color: white; }
   ```

### F. Validasi kualitas
10. **Uji di DevTools**: mode responsive, periksa *hover/focus*, preferensi `prefers-reduced-motion`.
11. **Audit aksesibilitas**: urutan tab, *contrast*, *aria-invalid* pada error form.
12. **Perf**: pakai `content-visibility`, *lazy load* gambar, subset font, minify CSS.

### G. Ritme kerja (bukan sekadar ikut tutorial)
- Mulai dari *design tokens* (spacing, warna, radius).
- Buat *utilities* dan *components* kecil lalu **refactor** ketika pola berulang muncul.
- Tuliskan *visual regression tests* ringan (snapshot) untuk komponen vital.
- Dokumentasikan di Storybook/Styleguide kecil agar tim lain konsisten.

---

## Ringkasan cepat
- **Cascade**: Importance → Layer → Specificity → Source order.
- **Responsive** = wajib: meta viewport, unit relatif, media/container queries, gambar fluid.
- **Box model**: padding (dalam), border (tepi), margin (luar); pakai `border-box`.
- **Flex vs Grid**: 1D (baris/kolom) vs 2D (baris+kolom).
- **Implementasi nyata**: fondasi CSS → layout → form → aksesibilitas → uji lintas perangkat.

