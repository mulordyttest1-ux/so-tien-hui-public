# Sổ Tiền & Hụi — Bản Public (nhiều người dùng)

App ghi tiền nhanh cho gia đình: thu/chi, **hụi – hốt hụi – lời lỗ hụi**, chi theo
ngày/tuần/tháng, chi theo người (con / chồng / mẹ…), thu theo nguồn (khoản A, B, C…).

Khác với bản mẫu trong Muse (chỉ 1 người dùng): bản này là **web app công khai** —
ai có link cũng vào được, **mỗi người đăng ký 1 tài khoản riêng và có 1 sổ riêng**,
không ai thấy dữ liệu của ai (bảo đảm bằng Row Level Security của Supabase).
Không có sổ/nhóm dùng chung trong giai đoạn này.

## Công nghệ

- **Next.js** (App Router) — giao diện + PWA (gắn ra màn hình chính iPhone/Android)
- **Supabase** — đăng nhập email/mật khẩu + database Postgres (bậc miễn phí)
- **Vercel** — nơi chạy web (bậc miễn phí)

## Mô hình dữ liệu (khung chuẩn)

- `transactions` là bảng trung tâm. Mỗi giao dịch gắn tự do 3 thẻ: **Người**
  (`persons`), **Hạng mục** (`categories`), **Nguồn tiền** (`sources`) — tạo mới
  ngay trong form ghi khoản. Nhờ vậy cùng 1 người (ví dụ chồng) vừa có khoản thu
  vừa có khoản chi, báo cáo vẫn đúng.
- Hụi là module riêng: `hui_groups` (tiền mỗi kỳ, số chân, số chân của mình,
  số kỳ, tiền thầu) + `hui_rounds` (từng kỳ: ai hốt, mình đóng bao nhiêu, mình
  hốt bao nhiêu). Khi ghi 1 kỳ, app tự tạo giao dịch gương vào sổ chung
  (đóng = chi, hốt = thu).
- Cách tính hụi giai đoạn 1: mỗi kỳ mình đóng = tiền 1 chân × số chân của mình;
  tiền hốt ước tính 1 lần = tiền 1 chân × tổng số chân − tiền thầu;
  “hụi chết” = tiền đóng mỗi kỳ × số kỳ còn lại sau kỳ mình hốt;
  lời/lỗ dự kiến = tổng hốt − tổng đóng cả dây.

## Cài đặt & deploy — từng bước

> Các bước đánh dấu ⭐ **chỉ Nancy làm được** vì phải tạo tài khoản bằng
> tên/email của Nancy. Người khác không làm thay được.

### Bước 1 ⭐ — Tạo dự án Supabase (miễn phí)

1. Vào https://supabase.com → **Start your project** → đăng ký / đăng nhập
   (bằng email hoặc GitHub).
2. **New project**: đặt tên ví dụ `so-tien-hui`, đặt mật khẩu database (lưu lại
   cẩn thận), chọn Region gần nhất (Singapore). Bấm Create, chờ ~1–2 phút.
3. Vào **SQL Editor** (menu trái) → **New query** → mở file `supabase/schema.sql`
   trong thư mục này, sao chép toàn bộ nội dung dán vào → bấm **Run**.
   Thấy “Success” là database đã sẵn sàng (đã gồm cả khóa bảo mật RLS).
4. Vào **Project Settings → API**, ghi lại 2 giá trị:
   - **Project URL** (dạng `https://xxxxx.supabase.co`)
   - **anon / public key** (khóa dài bắt đầu bằng `eyJ…`)
5. (Nên làm) Vào **Authentication → Settings**: nếu muốn người dùng đăng ký xong
   dùng ngay không cần bấm link trong email, tắt **Confirm email**.
   Để mặc định thì người đăng ký phải xác nhận email 1 lần.

### Bước 2 ⭐ — Tạo tài khoản Vercel và đưa code lên

Cách đơn giản nhất: đưa thư mục code này lên **GitHub** (tài khoản của Nancy),
rồi:

1. Vào https://vercel.com → đăng ký / đăng nhập (nên dùng chính tài khoản
   GitHub ở trên).
2. **Add New → Project** → chọn repo `so-tien-hui-public` → **Import**.
3. Mục **Environment Variables**, thêm 2 biến (lấy ở Bước 1.4):
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
4. Bấm **Deploy**. Chờ ~1–2 phút, Vercel cho 1 link dạng
   `https://so-tien-hui-public.vercel.app` — đó là link app để chia sẻ.

> Chạy thử trên máy tính (không bắt buộc): copy `.env.example` thành
> `.env.local`, điền 2 giá trị trên, rồi chạy `npm install` và `npm run dev`,
> mở http://localhost:3000.

### Bước 3 — Chia sẻ cho người dùng

- Gửi link Vercel cho mọi người. Họ mở link → **Đăng ký** bằng email của họ →
  đăng nhập → bắt đầu ghi sổ của riêng họ.
- **Gắn ra màn hình chính iPhone:** mở link bằng **Safari** → nút **Chia sẻ**
  (hình vuông có mũi tên lên) → **Thêm vào Màn hình chính** → Thêm.
  Từ đó chạm icon “Sổ Tiền & Hụi” là vào thẳng như app thường.
- Android (Chrome): mở link → menu ⋮ → **Thêm vào màn hình chính / Cài đặt ứng dụng**.

## Bảo mật dữ liệu

- Mọi bảng đều bật **Row Level Security**: mỗi tài khoản chỉ đọc/ghi được dòng
  có `user_id` của chính mình — kể cả khi ai đó biết anon key cũng không xem
  được sổ của người khác.
- Chỉ dùng **anon key** ở phía web. Tuyệt đối không đưa `service_role` key
  vào code hay Vercel env của app này.

## Giới hạn bậc miễn phí (để biết trước)

- Supabase Free: database 500 MB, đủ cho rất nhiều người ghi sổ cá nhân;
  dự án bị tạm dừng sau ~1 tuần không hoạt động (vào dashboard bấm Resume là chạy lại).
- Vercel Free (Hobby): đủ dùng cá nhân/nhóm nhỏ, không dùng cho mục đích
  thương mại theo điều khoản của Vercel — khi app lớn lên nên nâng cấp.

## Chưa làm (giai đoạn sau)

- Giai đoạn 2: nhắc ngày khui/đóng hụi.
- Giai đoạn 3: biểu đồ, xuất Excel/CSV, ngân sách, thông báo đẩy.
- Sổ dùng chung cho 1 nhóm hụi (nhiều tài khoản cùng xem 1 dây) — chưa có
  trong bản này, mỗi người tự quản lý dây hụi của mình.
