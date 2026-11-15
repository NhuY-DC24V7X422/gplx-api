# Dữ liệu câu hỏi

Thư mục này chứa dữ liệu câu hỏi và script tạo ra gói dữ liệu `catalog_v1.json`.
Gói này dùng để nạp vào MongoDB (seed) và để đóng kèm trong app.

> **Hiện tại là dữ liệu MẪU** (56 câu, 11 biển báo, 7 mức phạt) do nhóm tự soạn để chạy thử.
> Chưa phải bộ 600 câu chính thức, mức phạt và cấu hình đề hạng A, B cũng cần đối chiếu lại với văn bản gốc.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/` | Dữ liệu nguồn: `questions.sample.json`, `signs.sample.json`, `penalties.sample.json`, `categories.json`, `license_classes.json` (có cấu hình đề thi từng hạng) |
| `images/` | Ảnh câu hỏi `q_{số câu}.png` và ảnh biển báo `s_{mã biển}.png` |
| `schema/` | `catalog.schema.json`: mô tả định dạng của gói dữ liệu |
| `scripts/` | Các script bên dưới |
| `out/` | Kết quả build: `catalog_v1.json` và thư mục `images/` |
| `raw/` | Chỗ để file PDF gốc (không commit file lớn) |

## Lệnh

Chạy ở thư mục gốc `gplx-api`:

```bash
npm run data:validate   # kiểm tra dữ liệu nguồn
npm run data:build      # tạo data/out/catalog_v1.json
```

Tạo version khác: `node data/scripts/build-bundle.mjs --version 2`

`data:validate` kiểm tra:
- số câu không trùng, từ 1 đến 600
- mỗi câu có 2 đến 4 đáp án, đáp án đúng nằm trong danh sách
- chủ đề và hạng bằng hợp lệ, ảnh có tồn tại
- cấu hình đề: tổng số câu các slot đúng, kho câu hỏi đủ để ra đề
- mã biển báo không trùng, mức phạt có `fineMin` không lớn hơn `fineMax`

`data:build` chạy validate trước, nếu có lỗi thì dừng. Sau khi tạo gói sẽ kiểm tra lại bằng `schema/catalog.schema.json`.

## Id cố định

Mỗi câu hỏi, biển báo, mức phạt có id 24 ký tự hex tính từ số thứ tự, nên build bao nhiêu lần cũng ra cùng id.
App và database nhờ vậy dùng chung id cho cùng một câu hỏi.

| Loại | Dạng id | Ví dụ |
|---|---|---|
| Câu hỏi | `00` + 14 số 0 + số câu (hex, 8 ký tự) | câu 1: `000000000000000000000001` |
| Biển báo | `01` + ... | biển thứ nhất: `010000000000000000000001` |
| Mức phạt | `02` + ... | mức phạt thứ nhất: `020000000000000000000001` |
