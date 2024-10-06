const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();

let players = {};
let nickname = '';

// 닉네임 설정
document.getElementById('setNicknameBtn').addEventListener('click', () => {
    nickname = document.getElementById('nicknameInput').value;
    socket.emit('setNickname', nickname);
});

// 플레이어 정보 업데이트
socket.on('updatePlayers', (data) => {
    players = data;
    drawGame();
});

// 타이머 업데이트
socket.on('updateTimer', (timeLeft) => {
    document.title = `남은 시간: ${timeLeft}초`;
});

// 게임 결과 표시
socket.on('gameOver', (result) => {
    alert(`${result.winner} 승리!`);
    location.reload();
});

// 키보드 입력으로 이동
document.addEventListener('keydown', (event) => {
    let dx = 0, dy = 0;
    if (event.key === 'ArrowUp') dy = -10;
    if (event.key === 'ArrowDown') dy = 10;
    if (event.key === 'ArrowLeft') dx = -10;
    if (event.key === 'ArrowRight') dx = 10;
    
    socket.emit('move', { dx, dy });
});

// 게임 화면 그리기
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const id in players) {
        const player = players[id];
        ctx.fillStyle = player.color;
        if (player.isCaught) {
            ctx.fillStyle = 'gray'; // 잡힌 플레이어는 회색
        }
        ctx.fillRect(player.x, player.y, 50, 50); // 네모
        ctx.fillStyle = 'black';
        ctx.fillText(player.nickname, player.x, player.y - 10);
    }
}
