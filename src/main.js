/**
 * Character Spark - Core Logic
 * 90년대 마법소녀 감성의 캐릭터 영감 생성기
 */

// --- 데이터셋 ---
const DATASET = {
    fantasy: {
        label: "판타지",
        job: ["드래곤 슬레이어", "몰락한 귀족", "방랑하는 음유시인", "연금술사", "성기사", "흑마법사"],
        personality: ["고결한", "탐욕스러운", "자비로운", "교활한", "신비로운", "용맹한"],
        appearance: ["은색 갑옷", "흉터 있는 얼굴", "빛나는 눈", "망토를 두른", "룬 문자가 새겨진 장신구"],
        twist: ["사실은 유령", "저주에 걸린 왕자", "동물의 말을 알아들음", "기억 상실증", "정체를 숨긴 신"]
    },
    modern: {
        label: "현대물",
        job: ["카페 바리스타", "천재 해커", "강력계 형사", "무명 배우", "수의사", "스타트업 CEO"],
        personality: ["냉철한", "엉뚱한", "성실한", "까칠한", "다정다감한", "야심찬"],
        appearance: ["안경을 쓴", "항상 후드티", "세련된 수트", "주근깨가 있는", "단정한 단발"],
        twist: ["밤에는 자포자기", "사실은 재벌 3세", "이중 생활 중", "과거를 숨긴 요원", "초능력 소유자"]
    },
    scifi: {
        label: "SF/사이버펑크",
        job: ["안드로이드 수리공", "우주선 조종사", "사이버 펑크 용병", "행성 탐사 대원", "데이터 분석가"],
        personality: ["기계적인", "반항적인", "호기심 많은", "허무주의적인", "정의로운"],
        appearance: ["의수/의족", "홀로그램 안구", "금속성 피부", "네온 조명이 달린 옷", "삭발"],
        twist: ["인공지능의 자아", "외계인과 공생 중", "시간 여행자", "정부의 비밀 병기", "복제 인간"]
    }
};

const CATEGORIES = [
    { id: "job", label: "직업" },
    { id: "personality", label: "성격" },
    { id: "appearance", label: "외모 특성" },
    { id: "twist", label: "반전 매력" }
];

// --- 상태 관리 ---
let currentGenre = "fantasy";
let redrawCounts = { job: 0, personality: 0, appearance: 0, twist: 0 };
let currentCombination = { job: "", personality: "", appearance: "", twist: "" };

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    initGenreSelector();
    initCards();
    updateResetLimitInfo();
    renderArchive();
    
    // SPARK 버튼 이벤트
    document.getElementById('magic-circle-btn').addEventListener('click', handleGlobalReset);
    
    // 모달 닫기
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
    });
});

// --- 배경 효과 (별무리) ---
function initStarfield() {
    const container = document.getElementById('starfield');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'absolute bg-white rounded-full opacity-0';
        const size = Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // 깜빡이는 애니메이션
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 5;
        star.style.animation = `fade-in ${duration}s ease-in-out ${delay}s infinite alternate`;
        
        container.appendChild(star);
    }
}

// --- 장르 선택기 ---
function initGenreSelector() {
    const container = document.getElementById('genre-selector');
    Object.keys(DATASET).forEach(key => {
        const btn = document.createElement('button');
        btn.className = `px-6 py-2 rounded-full border-2 transition-all font-bold tracking-widest ${
            key === currentGenre ? 'bg-[#FFD700] text-[#2D1B4E] border-[#FFD700]' : 'border-[#FFD700]/30 text-[#FFD700] hover:border-[#FFD700]'
        }`;
        btn.textContent = DATASET[key].label;
        btn.onclick = () => {
            currentGenre = key;
            initGenreSelector(); // UI 갱신
            resetAllCards();
        };
        container.appendChild(btn);
    });
}

// --- 카드 초기화 ---
function initCards() {
    const container = document.getElementById('card-container');
    container.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-perspective h-80';
        
        cardWrapper.innerHTML = `
            <div class="card-inner w-full h-full cursor-pointer" id="card-${cat.id}">
                <div class="card-face card-front card-glow">
                    <div class="text-4xl mb-4">✦</div>
                    <div class="text-xl font-serif tracking-widest">${cat.label}</div>
                    <div class="mt-4 text-xs opacity-40 uppercase tracking-tighter">Click to Reveal</div>
                </div>
                <div class="card-face card-back">
                    <div class="text-xs opacity-60 mb-2 uppercase tracking-widest">${cat.label}</div>
                    <div class="text-2xl font-bold text-center leading-relaxed" id="text-${cat.id}">?</div>
                    <button class="redraw-btn mt-6 px-4 py-1 border border-[#2D1B4E]/30 rounded-full text-[10px] hover:bg-[#2D1B4E] hover:text-white transition-colors" data-cat="${cat.id}">
                        다시 뽑기 (<span id="count-${cat.id}">0</span>/3)
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(cardWrapper);
        
        // 카드 클릭 시 뒤집기
        const cardInner = cardWrapper.querySelector('.card-inner');
        cardInner.addEventListener('click', (e) => {
            if (e.target.closest('.redraw-btn')) return;
            if (!cardInner.classList.contains('is-flipped')) {
                revealCard(cat.id);
            }
        });
        
        // 다시 뽑기 버튼
        const redrawBtn = cardWrapper.querySelector('.redraw-btn');
        redrawBtn.addEventListener('click', () => redrawCard(cat.id));
    });
}

// --- 카드 뒤집기 로직 ---
function revealCard(catId) {
    const cardInner = document.getElementById(`card-${catId}`);
    const textEl = document.getElementById(`text-${catId}`);
    
    // 데이터 추출
    const pool = DATASET[currentGenre][catId];
    const result = pool[Math.floor(Math.random() * pool.length)];
    
    currentCombination[catId] = result;
    textEl.textContent = result;
    
    cardInner.classList.add('is-flipped');
    createSparks(cardInner);
    checkAndSaveCombination();
}

// --- 개별 카드 다시 뽑기 (최대 3회) ---
function redrawCard(catId) {
    if (redrawCounts[catId] >= 3) {
        showModal("이 카드의 마력이 소진되었습니다. (최대 3회)");
        return;
    }
    
    redrawCounts[catId]++;
    document.getElementById(`count-${catId}`).textContent = redrawCounts[catId];
    
    const cardInner = document.getElementById(`card-${catId}`);
    cardInner.classList.remove('is-flipped');
    
    setTimeout(() => {
        revealCard(catId);
    }, 400);
}

// --- 전체 리셋 (하루 10회) ---
function handleGlobalReset() {
    const today = new Date().toDateString();
    const resetData = JSON.parse(localStorage.getItem('spark_resets') || '{"date": "", "count": 0}');
    
    if (resetData.date !== today) {
        resetData.date = today;
        resetData.count = 0;
    }
    
    if (resetData.count >= 10) {
        showModal("오늘의 운명을 모두 확인하셨습니다. 내일 다시 찾아주세요. (최대 10회)");
        return;
    }
    
    resetData.count++;
    localStorage.setItem('spark_resets', JSON.stringify(resetData));
    updateResetLimitInfo();
    
    resetAllCards();
}

function resetAllCards() {
    redrawCounts = { job: 0, personality: 0, appearance: 0, twist: 0 };
    currentCombination = { job: "", personality: "", appearance: "", twist: "" };
    
    CATEGORIES.forEach(cat => {
        const cardInner = document.getElementById(`card-${cat.id}`);
        cardInner.classList.remove('is-flipped');
        document.getElementById(`count-${cat.id}`).textContent = "0";
    });
    
    showModal("마법의 힘으로 새로운 운명이 준비되었습니다!");
}

// --- 파티클 효과 ---
function createSparks(element) {
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 20; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark-particle';
        spark.style.left = `${rect.left + rect.width / 2}px`;
        spark.style.top = `${rect.top + rect.height / 2}px`;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 1000);
    }
}

// --- 아카이빙 (보관함) ---
function checkAndSaveCombination() {
    const isComplete = Object.values(currentCombination).every(val => val !== "");
    if (isComplete) {
        saveToArchive(currentCombination);
    }
}

function saveToArchive(combo) {
    let archive = JSON.parse(localStorage.getItem('spark_archive') || '[]');
    
    // 중복 체크
    const comboStr = JSON.stringify(combo);
    if (archive.some(item => JSON.stringify(item) === comboStr)) return;
    
    archive.unshift({...combo, id: Date.now()});
    if (archive.length > 20) archive.pop(); // 최대 20개 저장
    
    localStorage.setItem('spark_archive', JSON.stringify(archive));
    renderArchive();
}

function renderArchive() {
    const container = document.getElementById('archive-list');
    const archive = JSON.parse(localStorage.getItem('spark_archive') || '[]');
    
    if (archive.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-[#FFD700]/40 py-10 italic">아직 저장된 영감이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = '';
    archive.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-[#2D1B4E]/50 border border-[#FFD700]/20 p-6 rounded-xl hover:border-[#FFD700]/60 transition-all';
        div.innerHTML = `
            <div class="space-y-2 text-sm">
                <p><span class="text-[#FFB7C5] font-bold">직업:</span> ${item.job}</p>
                <p><span class="text-[#FFB7C5] font-bold">성격:</span> ${item.personality}</p>
                <p><span class="text-[#FFB7C5] font-bold">외모:</span> ${item.appearance}</p>
                <p><span class="text-[#FFB7C5] font-bold">반전:</span> ${item.twist}</p>
            </div>
            <button class="mt-4 text-[10px] text-[#FF4444] opacity-60 hover:opacity-100" onclick="deleteArchive(${item.id})">삭제</button>
        `;
        container.appendChild(div);
    });
}

window.deleteArchive = (id) => {
    let archive = JSON.parse(localStorage.getItem('spark_archive') || '[]');
    archive = archive.filter(item => item.id !== id);
    localStorage.setItem('spark_archive', JSON.stringify(archive));
    renderArchive();
};

// --- 유틸리티 ---
function updateResetLimitInfo() {
    const today = new Date().toDateString();
    const resetData = JSON.parse(localStorage.getItem('spark_resets') || '{"date": "", "count": 0}');
    const count = resetData.date === today ? 10 - resetData.count : 10;
    document.getElementById('reset-limit-info').textContent = `오늘의 전체 리셋 남은 횟수: ${count}/10`;
}

function showModal(text) {
    document.getElementById('modal-text').textContent = text;
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').classList.add('flex');
}
