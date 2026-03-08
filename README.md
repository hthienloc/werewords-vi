# # 🐺💬 Werewords Việt Nam (Companion App)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

Ứng dụng hỗ trợ chơi board game **Werewords** dành riêng cho người chơi Việt Nam. Đây là một companion app không chính thức, giúp quản lý từ khóa, bộ từ và thời gian chơi một cách tiện lợi nhất.

---

## 🌟 Tính năng chính (Key Features)

* **📚 Quản lý nhân vật & bộ từ (Character & Word Management):**
  * Tự chọn các nhân vật tham gia: *Nhà tiên tri, Ma sói, Kẻ soi mói, Tay sai, Thợ xây, Dân làng*.
  * Sử dụng các bộ từ có sẵn phong phú: *Đồ ăn, Địa danh Việt Nam, Động vật, Phim & Series, Thế giới xung quanh*.
  * Tự tạo bộ từ cá nhân hoặc chỉnh sửa bộ từ hiện có.
* **🎮 Chế độ chơi tự động (Autonomous Gameplay):**
  * **Giọng nói dẫn dắt:** Ứng dụng tự động gọi tên các vai trò dậy trong đêm (Narrator) mà không cần tương tác thủ công.
  * Tự động chọn từ ngẫu nhiên theo độ khó (Dễ, Trung bình, Khó).
  * Tích hợp bộ đếm giờ (Timer) có thể tùy chỉnh.
* **📜 Lịch sử ván chơi (Game History):** Lưu lại kết quả các ván đã chơi để theo dõi phong độ của Dân làng và Sói.
* **📱 Trải nghiệm người dùng cực tốt:** Giao diện tối hiện đại, tối ưu cho thiết bị di động, cảm giác mượt mà như ứng dụng bản địa (Native app).
* **💾 Lưu trữ cục bộ (Local Storage):** Toàn bộ dữ liệu của bạn được lưu ngay trên trình duyệt, không cần đăng nhập hay kết nối server.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **State Management:** React Context API + Reducer
* **Icons & UI:** Lucide React, Framer Motion (for animations)

---

## 🚀 Hướng dẫn cài đặt (Installation)

Nếu bạn muốn chạy dự án này dưới máy cục bộ hoặc đóng góp phát triển:

1. **Clone repository:**

    ```bash
    git clone https://github.com/hthienloc/werewords-vi.git
    cd werewords-vi
    ```

2. **Cài đặt dependencies:**

    ```bash
    npm install
    ```

3. **Chạy môi trường phát triển (Development):**

    ```bash
    npm run dev
    ```

    Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn.

---

## 📝 Giới thiệu về Werewords

**Werewords** là một trò chơi giải đố nhanh, trong đó người chơi cố gắng đoán một từ khóa bí mật bằng cách đặt các câu hỏi "Có" hoặc "Không". Tuy nhiên, có một con Sói lén lút biết từ khóa và cố gắng gây nhiễu, trong khi Nhà tiên tri cũng biết từ khóa nhưng phải giúp Dân làng mà không để Sói phát hiện ra mình.

---

## ⚖️ Bản quyền & Miễn trừ trách nhiệm

Dự án này là một công cụ hỗ trợ người chơi, không liên quan trực tiếp đến nhà phát hành game Werewords. Mọi quyền sở hữu trí tuệ về luật chơi và thương hiệu thuộc về chủ sở hữu tương ứng.

---
Created with ❤️ by **hthienloc**
