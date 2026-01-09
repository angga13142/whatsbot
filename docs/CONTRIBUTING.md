# Panduan Kontribusi

Terima kasih atas minat Anda untuk berkontribusi pada **WhatsApp Cashflow Bot**! Dokumen ini berisi panduan untuk memastikan kontribusi Anda efektif dan sesuai dengan standar proyek.

## 🌟 Kode Etik

Kami berkomitmen untuk menyediakan lingkungan yang ramah dan inklusif. Harap baca [Code of Conduct](CODE_OF_CONDUCT.md) kami sebelum berkontribusi.

## 🛠️ Alur Pengembangan

### 1. Persiapan

- Pastikan Anda menggunakan **Node.js v18+**.
- Install semua dependensi: `npm install`.
- Setup database lokal (SQLite) dengan `npm run migrate`.

### 2. Branching Strategy

- **main**: Branch produksi (stabil).
- **develop**: Branch pengembangan utama.
- **feat/...**: Fitur baru (contoh: `feat/image-upload`).
- **fix/...**: Perbaikan bug (contoh: `fix/auth-timeout`).
- **docs/...**: Perubahan dokumentasi.

### 3. Commit Convention

Kami menggunakan **Conventional Commits**. Pesan commit Anda akan divalidasi secara otomatis oleh `commitlint`.

Format: `<type>(<scope>): <subject>`

Tipe yang diizinkan:

- `feat`: Fitur baru
- `fix`: Perbaikan bug
- `docs`: Dokumentasi
- `style`: Formatting (spasi, titik koma, dll)
- `refactor`: Refactoring code (tanpa mengubah fungsi)
- `test`: Menambah/mengubah test
- `chore`: Maintenance (update deps, config)

Contoh Benar:

- ✅ `feat(transaction): add natural language parsing for amounts`
- ✅ `fix(auth): resolve pairing code retry limit`

Contoh Salah:

- ❌ `update code`
- ❌ `fix bug`

### 4. Code Style & Quality

Proyek ini menggunakan **ESLint** dan **Prettier**.

- Jalankan `npm run lint` untuk mengecek error.
- Jalankan `npm run format` untuk merapikan kode otomatis.
- **Husky** akan mencegah commit jika ada error linting.

### 5. Testing

Setiap fitur baru atau perbaikan bug **WAJIB** disertai test.

- Unit Test: `src/**/*.test.js`
- Jalankan test: `npm test`

---

## 📝 Pull Request Process

1. Pastikan branch Anda _up-to-date_ dengan `develop`.
2. Jalankan `npm run validate` untuk memastikan semua check (lint, format, test) lulus.
3. Buat Pull Request ke branch `develop`.
4. Isi template PR dengan lengkap (Deskripsi, Type of Change, Checklist).
5. Lampirkan screenshot/video jika ada perubahan UI pada bot.

Happy Coding! 🚀
