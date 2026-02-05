// DOM 요소
const clock = document.getElementById('clock');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const dateEl = document.getElementById('date');
const alarmBtn = document.getElementById('alarmBtn');
const fileBtn = document.getElementById('fileBtn');
const alarmStatus = document.getElementById('alarmStatus');
const alarmAudio = document.getElementById('alarmAudio');
const hourlyAudio = document.getElementById('hourlyAudio');

// 기본 알람 파일 경로
const DEFAULT_ALARM_FILE = '시계 알람.mp4';

// 상태 변수
let alarmTime = null; // 아침 알람 시간 (HH:MM 형식)
let alarmFile = null; // 아침 알람 파일
let hourlyFile = null; // 정시 알람 파일
let lastHourlyPlayed = -1; // 마지막으로 재생한 시간
let isAlarmPlaying = false; // 알람 재생 중 여부

// 기본 파일 설정
function setDefaultFiles() {
    // 기본 알람 파일이 존재하는지 확인하고 설정
    const defaultFile = new Audio(DEFAULT_ALARM_FILE);
    defaultFile.onerror = function() {
        console.log('기본 알람 파일을 찾을 수 없습니다:', DEFAULT_ALARM_FILE);
    };
    
    // 로컬 스토리지에 저장된 파일이 없으면 기본 파일 사용
    if (!localStorage.getItem('hourlyFile')) {
        hourlyFile = DEFAULT_ALARM_FILE;
        hourlyAudio.src = DEFAULT_ALARM_FILE;
    }
    
    if (!localStorage.getItem('alarmFile')) {
        alarmFile = DEFAULT_ALARM_FILE;
        alarmAudio.src = DEFAULT_ALARM_FILE;
    }
}

// 로컬 스토리지에서 설정 불러오기
function loadSettings() {
    const savedAlarmTime = localStorage.getItem('alarmTime');
    const savedAlarmFile = localStorage.getItem('alarmFile');
    const savedHourlyFile = localStorage.getItem('hourlyFile');
    
    if (savedAlarmTime) {
        alarmTime = savedAlarmTime;
    }
    if (savedAlarmFile) {
        alarmFile = savedAlarmFile;
        alarmAudio.src = savedAlarmFile;
    } else {
        // 저장된 파일이 없으면 기본 파일 사용
        alarmFile = DEFAULT_ALARM_FILE;
        alarmAudio.src = DEFAULT_ALARM_FILE;
    }
    if (savedHourlyFile) {
        hourlyFile = savedHourlyFile;
        hourlyAudio.src = savedHourlyFile;
    } else {
        // 저장된 파일이 없으면 기본 파일 사용
        hourlyFile = DEFAULT_ALARM_FILE;
        hourlyAudio.src = DEFAULT_ALARM_FILE;
    }
    
    updateAlarmStatus();
}

// 설정 저장
function saveSettings() {
    if (alarmTime) {
        localStorage.setItem('alarmTime', alarmTime);
    }
    if (alarmFile && alarmFile !== DEFAULT_ALARM_FILE) {
        localStorage.setItem('alarmFile', alarmFile);
    } else if (alarmFile === DEFAULT_ALARM_FILE) {
        // 기본 파일 사용 시 저장하지 않음 (다음에 기본 파일 사용)
        localStorage.removeItem('alarmFile');
    }
    if (hourlyFile && hourlyFile !== DEFAULT_ALARM_FILE) {
        localStorage.setItem('hourlyFile', hourlyFile);
    } else if (hourlyFile === DEFAULT_ALARM_FILE) {
        // 기본 파일 사용 시 저장하지 않음 (다음에 기본 파일 사용)
        localStorage.removeItem('hourlyFile');
    }
}

// 알람 상태 업데이트
function updateAlarmStatus() {
    let status = '';
    if (alarmTime) {
        status += `아침 알람: ${alarmTime}`;
    }
    if (hourlyFile) {
        if (status) status += ' | ';
        const fileName = hourlyFile === DEFAULT_ALARM_FILE ? '기본 파일 (시계 알람.mp4)' : '정시 알람 설정됨';
        status += `정시 알람: ${fileName}`;
    }
    alarmStatus.textContent = status || '알람이 설정되지 않았습니다.';
}

// 시계 업데이트
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    hoursEl.textContent = hours;
    minutesEl.textContent = minutes;
    secondsEl.textContent = seconds;
    
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    dateEl.textContent = now.toLocaleDateString('ko-KR', dateOptions);
    
    // 야간 모드 체크 (새벽 2시 ~ 7시)
    const currentHour = now.getHours();
    if (currentHour >= 2 && currentHour < 7) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }
    
    // 정시 알람 체크
    checkHourlyAlarm(now);
    
    // 아침 알람 체크
    checkMorningAlarm(now);
}

// 정시 알람 체크
function checkHourlyAlarm(now) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // 정시가 아니면 리턴
    if (currentMinute !== 0 || currentSecond !== 0) {
        return;
    }
    
    // 이미 이 시간에 재생했으면 리턴
    if (lastHourlyPlayed === currentHour) {
        return;
    }
    
    // 야간 모드 (새벽 2시 ~ 7시)에서는 정시 알람 재생 안 함
    if (currentHour >= 2 && currentHour < 7) {
        return;
    }
    
    // 정시 알람 파일이 설정되어 있으면 재생
    if (hourlyFile && hourlyAudio.src) {
        lastHourlyPlayed = currentHour;
        clock.classList.add('blink');
        
        // 반짝임 애니메이션 후 제거
        setTimeout(() => {
            clock.classList.remove('blink');
        }, 3000);
        
        // 알람 재생
        hourlyAudio.currentTime = 0;
        hourlyAudio.play().catch(err => {
            console.error('정시 알람 재생 실패:', err);
        });
    }
}

// 아침 알람 체크
function checkMorningAlarm(now) {
    if (!alarmTime || isAlarmPlaying) {
        return;
    }
    
    const [alarmHour, alarmMinute] = alarmTime.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // 알람 시간이 되었고, 초가 0일 때 (1초에 한 번만 체크)
    if (currentHour === alarmHour && currentMinute === alarmMinute && currentSecond === 0) {
        startMorningAlarm();
    }
}

// 아침 알람 시작
function startMorningAlarm() {
    if (!alarmFile || !alarmAudio.src) {
        return;
    }
    
    isAlarmPlaying = true;
    
    // 알람 재생 화면 표시
    const alarmOverlay = document.createElement('div');
    alarmOverlay.id = 'alarmOverlay';
    alarmOverlay.className = 'alarm-playing active';
    
    const stopBtn = document.createElement('button');
    stopBtn.className = 'alarm-stop-btn';
    stopBtn.textContent = '알람 끄기';
    stopBtn.onclick = stopMorningAlarm;
    
    alarmOverlay.appendChild(stopBtn);
    document.body.appendChild(alarmOverlay);
    
    // 알람 반복 재생
    alarmAudio.loop = true;
    alarmAudio.currentTime = 0;
    alarmAudio.play().catch(err => {
        console.error('아침 알람 재생 실패:', err);
        stopMorningAlarm();
    });
    
    // 시계 반짝임
    clock.classList.add('blink');
}

// 아침 알람 중지
function stopMorningAlarm() {
    isAlarmPlaying = false;
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmAudio.loop = false;
    
    const alarmOverlay = document.getElementById('alarmOverlay');
    if (alarmOverlay) {
        alarmOverlay.remove();
    }
    
    clock.classList.remove('blink');
}

// 알람 설정 모달 생성
function createAlarmModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'alarmModal';
    
    const currentFileName = alarmFile === DEFAULT_ALARM_FILE ? '기본 파일 (시계 알람.mp4)' : alarmFile.split('/').pop() || '파일 없음';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>아침 알람 설정</h2>
            <input type="time" id="alarmTimeInput" value="${alarmTime || '07:00'}">
            <div class="file-input-wrapper">
                <label>알람 파일 선택 (현재: ${currentFileName}):</label>
                <input type="file" id="alarmFileInput" accept="audio/*,video/*">
            </div>
            <div class="button-group">
                <button onclick="saveAlarmSettings()">저장</button>
                <button onclick="resetAlarmFile()">기본 파일로 복원</button>
                <button class="danger" onclick="deleteAlarmSettings()">삭제</button>
                <button onclick="closeAlarmModal()">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    // 파일 선택 이벤트
    const fileInput = document.getElementById('alarmFileInput');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            alarmFile = url;
            alarmAudio.src = url;
        }
    });
}

// 정시 알람 파일 선택 모달 생성
function createFileModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'fileModal';
    
    const currentFileName = hourlyFile === DEFAULT_ALARM_FILE ? '기본 파일 (시계 알람.mp4)' : hourlyFile.split('/').pop() || '파일 없음';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>정시 알람 파일 선택</h2>
            <div class="file-input-wrapper">
                <label>정시 알람 파일 선택 (현재: ${currentFileName}):</label>
                <input type="file" id="hourlyFileInput" accept="audio/*,video/*">
            </div>
            <div class="button-group">
                <button onclick="saveHourlyFile()">저장</button>
                <button onclick="resetHourlyFile()">기본 파일로 복원</button>
                <button class="danger" onclick="deleteHourlyFile()">삭제</button>
                <button onclick="closeFileModal()">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
    
    // 파일 선택 이벤트
    const fileInput = document.getElementById('hourlyFileInput');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            hourlyFile = url;
            hourlyAudio.src = url;
        }
    });
}

// 알람 설정 저장
window.saveAlarmSettings = function() {
    const timeInput = document.getElementById('alarmTimeInput');
    alarmTime = timeInput.value;
    
    saveSettings();
    updateAlarmStatus();
    closeAlarmModal();
};

// 알람 파일을 기본 파일로 복원
window.resetAlarmFile = function() {
    alarmFile = DEFAULT_ALARM_FILE;
    alarmAudio.src = DEFAULT_ALARM_FILE;
    saveSettings();
    updateAlarmStatus();
    closeAlarmModal();
};

// 정시 알람 파일을 기본 파일로 복원
window.resetHourlyFile = function() {
    hourlyFile = DEFAULT_ALARM_FILE;
    hourlyAudio.src = DEFAULT_ALARM_FILE;
    saveSettings();
    updateAlarmStatus();
    closeFileModal();
};

// 알람 설정 삭제
window.deleteAlarmSettings = function() {
    alarmTime = null;
    alarmFile = DEFAULT_ALARM_FILE;
    alarmAudio.src = DEFAULT_ALARM_FILE;
    localStorage.removeItem('alarmTime');
    localStorage.removeItem('alarmFile');
    updateAlarmStatus();
    closeAlarmModal();
    stopMorningAlarm();
};

// 정시 알람 파일 저장
window.saveHourlyFile = function() {
    saveSettings();
    updateAlarmStatus();
    closeFileModal();
};

// 정시 알람 파일 삭제
window.deleteHourlyFile = function() {
    hourlyFile = DEFAULT_ALARM_FILE;
    hourlyAudio.src = DEFAULT_ALARM_FILE;
    localStorage.removeItem('hourlyFile');
    updateAlarmStatus();
    closeFileModal();
};

// 모달 닫기
window.closeAlarmModal = function() {
    const modal = document.getElementById('alarmModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

window.closeFileModal = function() {
    const modal = document.getElementById('fileModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// 모달 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'alarmModal') {
            closeAlarmModal();
        } else if (e.target.id === 'fileModal') {
            closeFileModal();
        }
    }
});

// 버튼 이벤트
alarmBtn.addEventListener('click', createAlarmModal);
fileBtn.addEventListener('click', createFileModal);

// 초기화
setDefaultFiles();
loadSettings();
updateClock();
setInterval(updateClock, 1000); // 1초마다 시계 업데이트
