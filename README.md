# Legal AI Web

Ứng dụng chat AI pháp lý (frontend Next.js) chạy qua API nội bộ trong `frontend-app/app/api/*`.

## 1) Chạy ở môi trường dev

### Yêu cầu
- Node.js 20+
- npm 10+
- Backend API đang chạy (mặc định `http://localhost:8000`)

### Cách chạy
```bash
cd frontend-app
npm install
npm run dev
```

Mở trình duyệt: `http://localhost:3000`

Nếu backend không ở `localhost:8000`, set biến:
```bash
BACKEND_BASE_URL=http://your-backend-host:port
```

## 2) Chạy ở môi trường production (không Docker)

```bash
cd frontend-app
npm install
npm run build
npm run start
```

Mặc định app chạy ở port `3000`.

## 3) Đóng gói bằng Docker

### Build image
```bash
docker build -t legal-ai-web-frontend ./frontend-app
```

### Chạy container
```bash
docker run --rm -p 3000:3000 -e BACKEND_BASE_URL=http://host.docker.internal:8000 legal-ai-web-frontend
```

## 4) Chạy bằng docker-compose

```bash
docker compose up --build -d
```

Stop:
```bash
docker compose down
```

`docker-compose.yml` đã map:
- `3000:3000`
- biến môi trường `BACKEND_BASE_URL` (bạn chỉnh theo backend thật)
