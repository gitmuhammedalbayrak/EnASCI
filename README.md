# 🎮 EnASCI - 3D ASCII Game Engine & Retro RPG

Sıfır harici kütüphane bağımlılığına sahip, saf CPU üzerinde çalışan, **Barycentric Z-Buffer Software Rasterizer** mimarisiyle geliştirilmiş modüler **3D ASCII Oyun Motoru ve Retro RPG Macera Sahnesi**.

Tarayıcı ortamında (HTML5 Monospace Canvas) 60 FPS hızında çalışan bu motor; tüm vektör/matris matematiği, 3D rasterizasyonu, izometrik kamera projeksiyonu, rüzgarda salınan çimen fiziği, daktilo efektli diyalog sistemi ve 8-bit Web Audio chiptune sentezleyicisini sıfırdan içerir. Mimarisi gelecekte **C, C++ veya Rust (ncurses / Windows Console API)** gibi yerel (native) sistem seviyelerine doğrudan taşınabilecek şekilde saf standartlarda yazılmıştır.

---

## 🌟 Öne Çıkan Özellikler

### 🕹️ 1. Retro RPG Macera Dünyası
- **Top-Down / İzometrik RPG Takip Kamerası:** Karakteri yumuşak bir izometrik açıyla (*smooth lerp*) takip eden kamera sistemi.
- **Yürüyen Karakter (Player):** `W`, `A`, `S`, `D` veya ok tuşlarıyla 8 yöne hareket edebilen, yön açısına dönen ve gerçekçi adım sekme (*bobbing*) animasyonuna sahip 3D karakter.
- **Rüzgarda Salınan Çimenler (Waving Grass):** Zemin üzerindeki çimen demetlerinin $A \cdot \sin(\text{time} + x + z)$ harmonik dalga formülüyle rüzgarda sürekli salınması.
- **Çevre & Ağaçlar:** Kütük ve çok katmanlı piramit yeşil yapraklardan oluşan prosedürel 3D ağaçlar ve zemin karoları.
- **Etkileşimli NPC & Diyalog Sistemi:**
  - Bilge Büyücü Merlin'e yaklaşıldığında çıkan `[E] KONUŞ` uyarısı.
  - Daktilo ses efektli (*typewriter blip*), retro ASCII diyalog kutusu (`+---...---+`).
  - `[Space]` veya `[E]` ile sonraki repliklere ilerleme.
- **Retro Ana Menü Sahnesi:** `[ESC]` ile açılan, dönen 3D arka plan logolu, oyunu duraklatıp ses ayarlarını yönetebilen menü.

### 🎵 2. 8-Bit Chiptune Ses & Müzik Synthesizer
- Harici hiçbir MP3/WAV ses dosyası olmadan, doğrudan **Web Audio API** (`AudioContext`) üzerinden gerçek zamanlı sentezleme:
  - **Kare Dalga (Square Wave):** Klasik Game Boy / NES tarzı 8-bit ana melodi.
  - **Üçgen Dalga (Triangle Wave):** Yumuşak ve derin bas yürüyüşü.
  - **8-Bit Drum & Noise:** Hi-hat çırpıntıları ve snare vuruşları.
  - **Diyalog ve Menü Ses Efektleri:** Karakter daktilo bip sesleri ve menü seçim sesleri.

### 📐 3. Saf CPU 3D Matematik & Software Rasterizer
- **3D Matematik Kütüphanesi (`src/math.js`):** `Vec2`, `Vec3` (vektör aritmetiği, dot, cross, normalize), `Mat4` (Translation, Rotation, Scale, Perspective, LookAt).
- **Barycentric Interpolasyon:** 3D üçgenleri ekran uzayına izdüşürür ve pikselleri barycentric ağırlıklarla (`w0, w1, w2`) tarar.
- **Perspektif-Doğru Z-Buffering:** Derinlik çatışmalarını $1/z$ derinlik tamponu testi ile çözer.
- **Backface Culling & Clipping:** Kameranın arkasında kalan veya ters yöne bakan yüzeyleri eleyerek maksimum performans sağlar.
- **Dithering:** ASCII ton geçişlerini yumuşatır.

### 🎨 4. Çok Modlu ASCII Shading & Retro Temalar
- **Render Modları:**
  - `color`: Işık açısına göre gölgelenmiş renkli ASCII.
  - `shaded`: Lambertian Diffuse ($N \cdot L$) + Ortam Işığı + Speküler parıltılı monokrom ASCII.
  - `wireframe`: Bresenham algoritmasıyla tel kafes çizgileri (`+`, `-`, `/`, `\`, `|`).
  - `normals`: Yüzey normallerini açı yönlerine göre sembolleştirir (`^`, `v`, `<`, `>`, `O`).
  - `depth`: Z-Buffer derinlik haritası.
  - `textured`: UV interpolasyonu ile prosedürel damalı doku eşleme.
- **Karakter Kümeleri:** Standart (` .:-=+*#%@`), Detaylı (70 karakter), Bloklar (` ░▒▓█`), Matrix kodları (`0123...F`).
- **Retro Ekran Temaları:** RGB Tam Renk, Matrix Yeşili CRT, Amber Fosfor Monitör, Klasik Monokrom, Cyberpunk Neon.

---

## 🚀 Hızlı Başlangıç

### Seçenek 1: Doğrudan Tarayıcıda Açma (Sunucusuz)
Proje kök dizinindeki `index.html` dosyasını herhangi bir modern tarayıcıda doğrudan çift tıklayarak açabilirsiniz.

### Seçenek 2: Node.js Dev Sunucusu
```bash
node server.js
# veya: npm start
```
Tarayıcınızda açın: **`http://localhost:3000`**

### Seçenek 3: Python HTTP Sunucusu
```bash
python -m http.server 3000
```

---

## 🎮 Kontroller

| Tuş | Eylem |
| :--- | :--- |
| **`W` / `A` / `S` / `D` veya Ok Tuşları** | Karakteri 8 yöne hareket ettir |
| **`E` veya `Space`** | NPC (Merlin) ile konuş / Diyalogda ilerle |
| **`ESC`** | Ana Menüyü Aç / Oyunu Duraklat |
| **Fare Sol Tık + Sürükle** | Serbest Orbit modunda kamerayı 360° döndür |
| **Fare Tekerleği** | Yakınlaş / Uzaklaş (Zoom) |
| **📋 Butonu** | Ekranda o an çizilen saf ASCII karesini panoya kopyalar |

---

## 📁 Proje Mimarisi

```text
EnASCI/
│
├── index.html            # Oyun sahnesi, UI HUD ve ana görünüm
├── server.js             # Sıfır bağımlılıklı yerel geliştirme sunucusu
├── package.json          # Proje meta verileri
├── README.md             # Dokümantasyon
│
├── dist/
│   └── enasci.bundle.js  # Tek parça UMD / Tarayıcı motor bundle'ı
│
└── src/
    ├── math.js           # Vec2, Vec3, Mat4 3D matematik
    ├── mesh.js           # Vertex, Triangle, Mesh, Primitives, OBJ Parser
    ├── scene.js          # Scene, Camera, DirectionalLight
    ├── renderer.js       # FrameBuffer, Z-Buffer, Rasterizer, Shaders
    ├── display.js        # Monospace Canvas / ASCII Text Presenter
    ├── audio.js          # 8-Bit Web Audio chiptune synth & SFX
    ├── dialogue.js       # RPG daktilo efektli diyalog sistemi
    ├── world.js          # Karakter, çimenler, ağaçlar, NPC ve izometrik kamera
    └── engine.js         # Game loop, input yönetimi, FPS counter
```

---

## 🛠️ Yerel / Native Seviyeye (C / C++ / Rust) Geçiş Eşleştirmesi

Bu motor saf matematik ve tek boyutlu dizi tamponları (Buffer) üzerine kurulu olduğu için doğrudan C/C++ veya Rust terminal seviyesine taşınabilir:

| EnASCI Modülü | JavaScript / Web Katmanı | C / C++ / Rust Native Karşılığı |
| :--- | :--- | :--- |
| **Tamponlar (Buffer)** | `chars[]`, `depth[]`, `colors[]` | `char chars[W*H]`, `float depth[W*H]`, `uint32_t colors[W*H]` |
| **Rasterizer** | Barycentric rasterize döngüsü | SIMD / OpenMP ile çok çekirdekli CPU döngüsü |
| **Terminal Çıktısı** | Canvas `fillText` | Windows: `WriteConsoleOutputW` / Linux: `ncurses` veya ANSI escape |
| **Girdi (Input)** | Mouse & Keyboard Event Listener | `GetAsyncKeyState` (Win32) / `termios` (POSIX) |
| **Ses (Audio)** | Web Audio API Oscillator | PortAudio / SDL_Audio / miniaudio square/triangle waves |

---

## 📄 Lisans

Bu proje MIT lisansı altında açık kaynak olarak sunulmuştur.
