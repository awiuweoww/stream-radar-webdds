---
description: Aturan dan panduan untuk Frontend Development (React, TypeScript, UI Components).
globs:
  - "**/*.ts"
  - "**/*.tsx"
---

# AI Agent Rules & Guidelines untuk Frontend Development

## 1. General Principles & Code Quality (Clean Code)

- **Kerapian & Keterbacaan**: Tulis kode yang mudah dibaca, ringkas, dan jelas tujuannya. Terapkan prinsip SOLID dan aturan Single Responsibility (satu fungsi/komponen hanya melakukan satu hal).
- **TypeScript First**: Wajib menggunakan TypeScript dengan typing yang ketat (strict). Dilarang menggunakan tipe `any` kecuali benar-benar terpaksa (gunakan `unknown` atau define type-nya).
- **Lolos ESLint**: Semua kode yang di-generate harus mematuhi aturan linting proyek. Tidak boleh ada error atau warning ESLint, dan pastikan tidak ada variabel yang dideklarasikan tapi tidak digunakan (`no-unused-vars`).
- **DRY (Don't Repeat Yourself)**: Jika ada logika atau gaya yang diulang lebih dari dua kali, ekstrak menjadi fungsi, komponen, atau variabel terpisah.

## 2. Component Development

- **Gunakan Common Library**: Wajib mengutamakan penggunaan komponen UI yang sudah ada di common library proyek (misal dari folder `components/common/` atau library UI internal). Jangan membuat _reinvent the wheel_ untuk komponen dasar seperti Input, Button, Modal, atau Table.
- **Functional Components**: Selalu buat React component sebagai fungsi (functional component).
- **Props Typing**: Selalu definisikan tipe Props komponen menggunakan `interface` atau `type` TypeScript.

## 3. Pemisahan Logika (Hooks & Utils)

- **Custom Hooks**: Jika sebuah komponen memiliki lebih dari 2 state kompleks, ada fetching data, atau manipulasi data/event yang rumit, ekstrak logika tersebut ke dalam Custom Hook (misal: `useTrackSuggestions`, `useManualTrackUpdate`). Biarkan komponen utama hanya fokus pada UI (Presentational logic).
- **Utils & Helpers**: Pisahkan operasi kalkulasi, manipulasi array/string, dan pure functions ke dalam file di folder `utils/`. File utilitas ini harus terisolasi dan testable (tidak bergantung pada react hooks).

## 4. Performance & Optimization

- **useMemo**: Wajib digunakan untuk kalkulasi data yang berat atau memanipulasi list/array besar sebelum di-render (seperti filter, sort, mapping data untuk tabel).
- **useCallback**: Gunakan untuk fungsi yang dikirim sebagai props ke komponen anak (child components) agar mencegah re-render turunan yang tidak perlu.
- **useEffect Safety**: Tulis `useEffect` seminimal mungkin. Pastikan dependency array terisi otomatis dengan benar dan tambahkan cleanup function jika menggunakan event listener, timeout, atau observer untuk mencegah memory leak.

## 5. State Management

- **Global State (Zustand)**: Untuk state yang digunakan lintas modul atau fitur (seperti Track Info atau user session), gunakan Zustand (contoh: `useTrackInfoStore`). Jangan gunakan Context API jika sudah memakai Zustand.
- **Local State**: Gunakan `useState` secara wajar hanya untuk interaksi spesifik di dalam komponen (seperti input field lokal, toggle modal).

## 6. Naming Conventions

- **Bentuk Nama File**:
  - File Komponen: `PascalCase.tsx` (misal: `TrackInfoTable.tsx`)
  - Hooks: `camelCase.ts` dengan prefix "use" (misal: `useTrackSuggestions.ts`)
  - Types/Interfaces: Tambahkan kata "types" seperti `kinematic.types.ts`
- **Variabel & Fungsi**: `camelCase`. Nama fungsi handler biasanya diawali dengan aksi seperti `handle...` (contoh: `handleUpdateRows`) atau `on...` untuk props.
- **Types/Interfaces**: Gunakan `PascalCase` tanpa prefix `I` (contoh: `TrackDetails`, bukan `ITrackDetails`).

## 7. Theming & Styling (Dilarang Hardcode Warna)

- **Dilarang Hardcode Warna**: Jangan pernah menulis atau mendeklarasikan warna secara manual menggunakan kode Hex (contoh: `#FF5733`), RGB, atau nama warna literal (`red`, `blue`) langsung di dalam komponen, inline style, maupun file CSS/SCSS lokal.
- **Gunakan Centralized Theme/Tokens**: Semua penggunaan warna wajib memanggil variabel dari tema global atau design tokens yang sudah disediakan di dalam proyek.
  - _Contoh Tailwind_: Gunakan class bawaan tema seperti `text-primary-500`, `bg-surface-dark`, atau `var(--color-text-secondary)`.
  - _Contoh Constants_: Import dari file konstanta seperti `import { bgColor, textColor } from '@/constants/colors.constant'`.
- **Tujuan Khusus**: Aturan ini memastikan bahwa aplikasi Anda selalu konsisten, mudah di-maintenance, dan mendukung fitur seperti pergantian tema (Dark/Light Mode) secara langsung tanpa harus mengubah komponen satu per satu.
