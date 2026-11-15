# GPLX Pro – Backend API

Backend cho ứng dụng ôn thi lý thuyết giấy phép lái xe (NestJS + MongoDB).

## Chạy thử

Cần Node.js 20+ và MongoDB đang chạy ở `localhost:27017`
(hoặc dùng MongoDB Atlas miễn phí rồi đổi `MONGODB_URI`).

```bash
npm install
cp .env.example .env     # đổi JWT_ACCESS_SECRET thành chuỗi ngẫu nhiên >= 32 ký tự
npm run start:dev        # http://localhost:3000/api/v1/health
```

Tài liệu API (Swagger): http://localhost:3000/api/docs

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run start:dev` | Chạy dev, tự reload khi sửa code |
| `npm run build` | Build ra thư mục `dist/` |
| `npm test` | Unit test |
| `npm run test:e2e` | Test e2e |
| `npm run lint` | Kiểm tra và tự sửa định dạng code |
| `npm run data:validate` | Kiểm tra dữ liệu câu hỏi trong `data/src` |
| `npm run data:build` | Tạo gói dữ liệu `data/out/catalog_v1.json` (xem `data/README.md`) |

## Cấu trúc

```
src/
├── main.ts, setup-app.ts   khởi động, cấu hình chung (prefix /api/v1, helmet, CORS, validation, Swagger)
├── config/                 đọc và kiểm tra biến môi trường
├── common/                 lỗi chuẩn, bộ lọc lỗi, định dạng response { data, meta }
├── domain/                 logic thuần (không dùng database): ngày giờ VN, bỏ dấu, SM-2, tính tiến độ, chấm bài thi
└── modules/                health (các module khác sẽ thêm dần)
data/                       dữ liệu câu hỏi mẫu và script tạo gói dữ liệu
test/vectors/               các ca test dùng chung với app Flutter (cùng đầu vào thì 2 bên phải ra cùng kết quả)
```

## Quy ước response

- Thành công: `{ "data": ... }`, danh sách có phân trang thì thêm `meta`.
- Lỗi: `{ "statusCode": 404, "error": "NOT_FOUND", "message": "...", "details": ... }`.
