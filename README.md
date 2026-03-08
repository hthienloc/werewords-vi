# 🐺💬 Werewords Việt Nam (Companion App)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Ứng dụng hỗ trợ chơi board game **Werewords** (phiên bản Việt hóa). Đây là một companion app mạnh mẽ, giúp tự động hóa quá trình quản dẫn dắt (narration), quản lý từ khóa và thời gian chơi một cách chuyên nghiệp.

---

## 🌟 Tính năng nổi bật (Highlights)

* **🎭 Quản lý nhân vật đa dạng:**
  * Hỗ trợ đầy đủ các vai trò: *Thị trưởng, Nhà tiên tri, Ma sói, Tiên tri tập sự, Kẻ soi mói, Tay sai, Thợ xây, Dân làng*.
  * Cơ chế Thị trưởng chọn **1 trong 2 từ khóa** ngẫu nhiên giúp tăng tính chiến thuật.
* **🎙️ Dẫn dắt tự động chuyên nghiệp (Smart Narration):**
  * **Đồng bộ TTS:** Giọng nói dẫn dắt tiếng Việt tự động, tích hợp xử lý thông minh (chờ nói xong mới đếm giờ).
  * **Narration Roles:** Tự động gọi các vai trò dậy trong đêm với kịch bản được tối ưu hóa.
  * **Tiên tri (Fortune Teller):** Tự động gợi ý các chữ cái đầu của từ khóa.
* **📱 Giao diện 4 hướng độc đáo (4-Way Reveal UI):**
  * Hiển thị từ khóa ở 4 cạnh màn hình giúp mọi người xung quanh bàn đều có thể quan sát dễ dàng.
  * Tự động điều chỉnh cỡ chữ (Auto-scaling) cho các từ khóa dài.
  * Bố cục Grid thông minh, chống đè lên các thành phần UI khác.
* **⚙️ Tùy chỉnh linh hoạt (Deep Customization):**
  * Tùy chỉnh độ dài từng giai đoạn: Ban đêm, Thời gian chọn từ, Thời gian hành động của các vai trò.
  * Kho từ vựng khổng lồ (>1000 từ) chia theo nhiều chủ đề: *Đồ ăn, Việt Nam, Động vật, Phim ảnh, Thế giới...*
  * Hỗ trợ tạo bộ từ khóa cá nhân.
* **⚡ Trải nghiệm tối ưu:**
  * Chế độ **Auto-start**: Bắt đầu ngay khi thiết lập xong, không cần bấm thêm.
  * Giao diện tối (Dark Mode) hiện đại, full-screen, tối ưu cho thiết bị di động.
  * Hoạt động offline hoàn toàn nhờ Local Storage.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Audio:** Web Speech API (TTS) & HTML5 Audio Context
* **State Management:** React Context API + Reducer

---

## 🚀 Hướng dẫn cài đặt (Installation)

1. **Clone repository:**

    ```bash
    git clone https://github.com/hthienloc/werewords-vi.git
    cd werewords-vi
    ```

2. **Cài đặt dependencies:**

    ```bash
    npm install
    ```

3. **Chạy môi trường phát triển:**

    ```bash
    npm run dev
    ```

    Mở [http://localhost:3000](http://localhost:3000) để trải nghiệm.

---

## 📝 Giới thiệu về Werewords

**Werewords** là một trò chơi giải đố nhanh, trong đó người chơi cố gắng đoán một từ khóa bí mật bằng cách đặt các câu hỏi "Có" hoặc "Không". Tuy nhiên, có một con Sói lén lút biết từ khóa và cố gắng gây nhiễu, trong khi Nhà tiên tri cũng biết từ khóa nhưng phải giúp Dân làng mà không để Sói phát hiện ra mình.

---

## ⚖️ Giấy phép

Dự án này được phát hành dưới giấy phép **GNU GPLv3**. Bạn có quyền tự do sử dụng, sửa đổi và phân phối lại mã nguồn theo các điều khoản của giấy phép này.

---
Created with ❤️ by **hthienloc**
