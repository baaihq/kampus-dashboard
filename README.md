<div align="center">

# 🎓 Dashboard SNBP & SNBT Indonesia

**Analisis daya tampung, peminat, dan rasio keketatan seluruh jurusan Perguruan Tinggi Negeri untuk seleksi SNBP & SNBT (2021–2025).**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white&style=flat)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white&style=flat)

</div>

---

## ✨ Fitur

- **Ringkasan Nasional** — KPI cards dengan sparkline, statistik multi-tahun, trending jurusan, dan top ranking dengan medali.
- **Pencarian & Filter Jurusan** — pencarian instan, filter chips (kategori PTN & jenjang), filter PTN/provinsi, dan sorting pada semua kolom.
- **Detail Jurusan** — tren peminat & daya tampung 2021–2025, rasio keketatan, acceptance rate, peminat per provinsi (SNBT), tombol salin/bagikan/favorit.
- **Perbandingan SNBP vs SNBT** — panel kiri vs kanan, radar chart, dan progress bar metrik.
- **Daftar PTN** — kartu modern berisi jumlah jurusan, daya tampung, dan peminat.
- **Dark Mode** — tema gelap lembut dengan persistensi `localStorage` (default: light).
- **Responsive** — optimal untuk mobile, tablet, dan desktop.
- **Animasi** — Framer Motion (page transition, reveal on scroll, animated counter).

## 🧰 Teknologi

| Bagian      | Teknologi                                             |
| ----------- | ----------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS 4            |
| Chart       | Recharts                                              |
| Animasi     | Framer Motion                                         |
| Ikon        | Lucide Icons                                          |
| Crawler     | Python 3.13, `requests`, `beautifulsoup4`             |

## 📁 Struktur Proyek

```
kampus/
├── crawler/                 # Script Python untuk mengumpulkan data
│   ├── crawl.py             # Crawler utama (SNBP + SNBT, multi-tahun)
│   ├── requirements.txt
│   └── samples/             # Contoh HTML untuk pengembangan parser
└── dashboard/               # Aplikasi web
    ├── public/data/         # Hasil crawl (JSON) yang ditampilkan dashboard
    └── src/
        ├── components/      # Komponen reusable (DataTable, ui, charts, dll.)
        ├── context/         # KampusProvider & kampusContext
        ├── lib/             # Util: format, hooks, keys
        └── pages/           # Home, Jurusan, Detail, PTN, Perbandingan
```

## 📊 Data

- **Sumber**: `sidatagrun` — daftar PTN & prodi SNBP/SNBT.
- **Cakupan**: 146 PTN · 5.142 prodi SNBP · 5.140 prodi SNBT.
- **Periode**: 2021–2025 (daya tampung, peminat, rasio keketatan, peminat per provinsi).
- Rasio keketatan = daya tampung ÷ peminat (%). Semakin kecil angkanya, semakin ketat persaingan.

## 🚀 Memulai

### Prasyarat

- Node.js ≥ 20
- Python 3.12+ (hanya untuk menjalankan crawler)
- npm ≥ 10

### 1. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Buka **http://localhost:6969**.

### 2. Crawler (opsional — untuk memperbarui data)

```bash
cd crawler
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # Linux / macOS
pip install -r requirements.txt

python crawl.py --workers 3 --delay 0.3
```

Hasil crawl otomatis tersimpan ke `dashboard/public/data/` dan langsung dipakai dashboard.

### Skrip npm

| Perintah        | Fungsi                                             |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Menjalankan server pengembangan di port 6969       |
| `npm run build` | Build produksi ke folder `dist/`                   |
| `npm run preview` | Pratinjau hasil build di port 6969               |
| `npm run lint`  | TypeScript (`tsc --noEmit`) + ESLint               |
| `npm run lint:ts` | Hanya pengecekan TypeScript                      |
| `npm run lint:eslint` | Hanya pengecekan ESLint                     |

## 🌐 Deploy di Ubuntu (Nginx)

Build statis, tidak memerlukan runtime Node di server. Folder hasil build (`dashboard/dist`)
dapat disajikan langsung oleh Nginx.

### Cara tercepat — satu perintah

```bash
# di server (install git, Node.js, Nginx + clone + build + konfigurasi)
bash install.sh                # atau: bash install.sh domain.com
```

Script menginstall dependensi, menyalin repo, membangun dashboard, lalu mengonfigurasi Nginx.
Untuk update berikutnya cukup jalankan `deploy/server-deploy.sh` di folder repo.

### Opsi A — Otomatis dengan GitHub Actions

Setiap push ke `main`, workflow `.github/workflows/deploy.yml` akan membangun dashboard lalu
mengirim hasilnya ke server via rsync. Siapkan 5 secrets di **Settings → Secrets and variables →
Actions**:

| Secret            | Contoh                                     |
| ----------------- | ------------------------------------------ |
| `SSH_HOST`        | `203.0.113.10`                             |
| `SSH_USER`        | `ubuntu`                                   |
| `SSH_PORT`        | `22`                                       |
| `SSH_PRIVATE_KEY` | isi dengan isi file kunci SSH privat       |
| `SERVER_PATH`     | isi dengan path folder hasil build di server (mis. di bawah direktori repo) |

Kunci publik SSH (pasangan `SSH_PRIVATE_KEY`) harus terdaftar di `~/.ssh/authorized_keys`
user deploy di server.

### Opsi B — Manual (rsync)

```bash
# setup Nginx sekali jalan
bash deploy/setup-server.sh                 # atau: bash deploy/setup-server.sh domain.com

# deploy dari komputer Anda (build + kirim ke folder hasil build)
SERVER_HOST=203.0.113.10 ./deploy/deploy.sh
```

---

<div align="center">

**Dibangun oleh [Achmad Baihaqih](https://github.com/baaihq) · Built with AI** ✨

</div>
