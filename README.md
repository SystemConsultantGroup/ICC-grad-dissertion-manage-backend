### Overall Structure
![image](https://github.com/SystemConsultantGroup/real-ice-gs-thesis-backend/assets/60565169/ec77a2c2-8400-457b-8dd6-df2b92461082)


### local에서 실행 (port=4000)
local 환경에 맞는 .env 파일 생성
```bash
npm install
npx prisma db seed
npm run start
```

### 주의사항
- html 크기와 카프카 메시지 크기 리밋를 신경 써주세요.
