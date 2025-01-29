const express = require('express');
const voyagerRoutes = require('./routes/voyagerRoutes');

const app = express();
app.use(express.json());

// Voyager 관련 라우터
app.use('/voyager', voyagerRoutes);

// 서버 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
