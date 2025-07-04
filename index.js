const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); // JSONの受け取り対応
app.use(express.static('public')); // publicフォルダにHTMLなどを置く

let displayDoctor2 = true; // 表示フラグ（初期値：true）

// 表示フラグの取得
app.get('/api/display-flag', (req, res) => {
  res.json({ doctor2: displayDoctor2 });
});

// 表示フラグの更新
app.post('/api/display-flag', (req, res) => {
  const { doctor2 } = req.body;
  if (typeof doctor2 === 'boolean') {
    displayDoctor2 = doctor2;
    res.json({ status: 'OK', doctor2: displayDoctor2 });
  } else {
    res.status(400).json({ status: 'error', message: 'doctor2 must be boolean' });
  }
});

// ✅ 呼出中の番号（診察①、②、リハビリ）
let calledNumbers = {
  doctor1: "014",
  doctor2: "021",
  rehab: "007"
};

// ✅ 呼出中と待機中、完了などすべて含んだ番号リスト
let waitingData = {
  'doctor1-waiting': ['013', '015', '016'],
  'doctor2-waiting': ['020', '022'],
  'rehab-waiting': ['006', '008'],
  'doctor1-called': ['014'],
  'doctor2-called': ['021'],
  'rehab-called': ['007'],
  'completed-list': []
};

// 🔹 呼出中番号の取得（GET）
app.get('/api/called', (req, res) => {
  res.json(calledNumbers);
});

// 🔹 呼出中番号の更新（POST）
app.post('/api/called', (req, res) => {
  const { doctor1, doctor2, rehab } = req.body;
  if (doctor1 !== undefined) calledNumbers.doctor1 = doctor1;
  if (doctor2 !== undefined) calledNumbers.doctor2 = doctor2;
  if (rehab !== undefined) calledNumbers.rehab = rehab;

  res.json({ status: "OK", updated: calledNumbers });
});

// 🔹 待機番号リストの取得（GET）
app.get('/api/waiting', (req, res) => {
  res.json(waitingData);
});

// 🔹 待機番号リストの更新（POST）
app.post('/api/waiting', (req, res) => {
  try {
    waitingData = req.body;
    res.json({ status: 'ok', received: waitingData });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

let noticeMessage = ""; // お知らせ保持

app.get('/api/notice', (req, res) => {
  res.json({ notice: noticeMessage });
});

app.post('/api/notice', (req, res) => {
  const { notice } = req.body;
  noticeMessage = notice || "";
  res.json({ status: 'ok', notice: noticeMessage });
});

const fs = require('fs');
const PORT = 3000;

app.use(express.json());

app.post('/api/complete', (req, res) => {
  const { doctor, number } = req.body;
  if (!doctor || !number) {
    return res.status(400).json({ message: 'doctorとnumberが必要です' });
  }

  const calledKey = `${doctor}-called`; // 例: doctor1-called
  const completedKey = 'completed-list';

  // 安全に元のデータをコピー
  const updatedData = JSON.parse(JSON.stringify(waitingData));

  // 対象リストに番号があるか確認
  if (!updatedData[calledKey] || !Array.isArray(updatedData[calledKey])) {
    return res.status(400).json({ success: false, message: '無効なdoctor指定' });
  }

  // 呼出中から削除
  updatedData[calledKey] = updatedData[calledKey].filter(n => n !== number);

  // 完了リストに追加（重複防止）
  if (!updatedData[completedKey]) updatedData[completedKey] = [];
  if (!updatedData[completedKey].includes(number)) {
    updatedData[completedKey].push(number);
  }

  // 保存
  fs.writeFile('./data/waiting.json', JSON.stringify(updatedData, null, 2), 'utf8', err => {
    if (err) {
      console.error('保存失敗', err);
      return res.status(500).json({ success: false, message: '保存失敗' });
    }

    // 成功したらグローバル変数にも反映
    waitingData = updatedData;

    res.json({ success: true });
  });
});



let emergency = false;

app.get('/api/emergency', (req, res) => {
  res.json({ emergency });
});

app.post('/api/emergency', (req, res) => {
  emergency = !!req.body.emergency;
  res.json({ success: true });
});

// 🔹 サーバー起動
app.listen(port, () => {
  console.log(`✅ サーバーが http://localhost:${port} で起動中！`);
});
