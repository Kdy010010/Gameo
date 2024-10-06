const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// 서버 설정
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
let players = {}; // 플레이어 목록
let gameStatus = {
    timeLeft: 180, // 3분 (180초)
    sleuth: null,  // 술래
    secretAgents: [], // 비밀 요원
    gameStarted: false
};

// 정적 파일 제공
app.use(express.static('public'));

// 플레이어 연결 처리
io.on('connection', (socket) => {
    console.log('새 플레이어 연결:', socket.id);

    // 플레이어가 들어오면 초기 정보 설정
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * 500, // 랜덤 위치
        y: Math.random() * 500, // 랜덤 위치
        color: 'blue', // 기본 시민은 파란색
        isCaught: false,
        isSecretAgent: false,
        nickname: `Player_${socket.id.slice(0, 4)}` // 임시 닉네임
    };

    // 새 플레이어 정보 클라이언트에 전송
    io.emit('updatePlayers', players);

    // 플레이어가 닉네임 설정
    socket.on('setNickname', (nickname) => {
        players[socket.id].nickname = nickname;
        io.emit('updatePlayers', players);
    });

    // 플레이어가 이동할 때
    socket.on('move', (data) => {
        if (!players[socket.id].isCaught) { // 잡히지 않은 플레이어만 이동 가능
            players[socket.id].x += data.dx;
            players[socket.id].y += data.dy;
            io.emit('updatePlayers', players);
        }
    });

    // 플레이어가 터치할 때
    socket.on('touchPlayer', (targetId) => {
        // 술래가 다른 플레이어를 잡음
        if (socket.id === gameStatus.sleuth && players[targetId]) {
            players[targetId].isCaught = true;
            io.emit('updatePlayers', players);
        }

        // 비밀 요원이 가만히 있는 시민을 풀어줌
        if (players[socket.id].isSecretAgent && players[targetId].isCaught) {
            players[targetId].isCaught = false;
            io.emit('updatePlayers', players);
        }
    });

    // 연결 해제
    socket.on('disconnect', () => {
        console.log('플레이어 연결 해제:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

// 3분 타이머 시작 함수
function startGame() {
    gameStatus.timeLeft = 180; // 3분 설정
    gameStatus.gameStarted = true;
    gameStatus.sleuth = Object.keys(players)[0]; // 첫 번째 플레이어가 술래
    gameStatus.secretAgents = Object.keys(players).slice(1, 3); // 두 명의 비밀 요원 설정
    gameStatus.secretAgents.forEach(id => {
        players[id].isSecretAgent = true;
    });

    const interval = setInterval(() => {
        if (gameStatus.timeLeft > 0) {
            gameStatus.timeLeft--;
            io.emit('updateTimer', gameStatus.timeLeft);
        } else {
            clearInterval(interval);
            endGame();
        }
    }, 1000);
}

// 게임 종료 처리
function endGame() {
    let secretAgentsRemaining = gameStatus.secretAgents.some(id => !players[id].isCaught);
    
    if (secretAgentsRemaining) {
        io.emit('gameOver', { winner: 'citizens' });
    } else {
        io.emit('gameOver', { winner: 'sleuth' });
    }

    gameStatus.gameStarted = false;
}

// 서버 시작
server.listen(port, () => {
    console.log(`서버가 ${port} 포트에서 실행 중입니다.`);
});
