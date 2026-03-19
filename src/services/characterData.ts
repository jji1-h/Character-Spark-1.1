/**
 * Character Spark - Core Data & Logic
 */

export const KEYWORD_PACKS = {
  daily: {
    label: '일상',
    job: ['카페 바리스타', '사서', '정원사', '고등학교 교사', '프리랜서 디자이너', '건축가', '편의점 알바생', '사회복지사'],
    personality: ['평범한', '성실한', '엉뚱한', '낙천적인', '꼼꼼한', '내성적인', '다정다감한', '현실적인'],
    appearance: ['안경을 쓴', '주근깨가 있는', '항상 후드티를 입은', '단정한 단발', '키가 큰', '운동화가 낡은'],
    twist: ['요리가 취미', '반전 노래 실력', '밤마다 비밀 일기를 씀', '고전 영화 광', '뜨개질 마스터', '반전 주량'],
  },
  fantasy: {
    label: '판타지',
    job: ['몰락한 귀족', '방랑하는 음유시인', '드래곤 슬레이어', '약초 채집가', '성기사', '흑마법사', '연금술사', '엘프 순찰자'],
    personality: ['고결한', '탐욕스러운', '자비로운', '교활한', '신비로운', '용맹한', '신중한', '명예를 아는'],
    appearance: ['빛나는 눈', '흉터가 있는 얼굴', '망토를 두른', '긴 백발', '룬 문자가 새겨진 장신구', '은색 갑옷', '뾰족한 귀'],
    twist: ['정체를 숨긴 왕족', '저주에 걸림', '동물의 말을 알아들음', '기억 상실증', '사실은 유령', '전설의 무기 소유자'],
  },
  scifi: {
    label: 'SF',
    job: ['안드로이드 수리공', '우주선 조종사', '사이버 펑크 해커', '행성 탐사 대원', '외계 생물학자', '용병', '데이터 분석가'],
    personality: ['기계적인', '반항적인', '냉철한', '호기심 많은', '허무주의적인', '정의로운', '계산적인'],
    appearance: ['의수/의족', '홀로그램 안구', '금속성 피부', '네온 조명이 달린 옷', '삭발', '칩이 내장된 목', '은색 수트'],
    twist: ['인공지능의 자아', '외계인과 공생 중', '시간 여행자', '정부의 비밀 병기', '사실은 복제 인간', '기억이 업로드됨'],
  },
  romance: {
    label: '현대 로맨스',
    job: ['재벌 3세', '패션 매거진 에디터', '유명 아이돌', '무명 배우', '수의사', '파티시에', '베스트셀러 작가'],
    personality: ['까칠한', '다정한', '집착하는', '츤데레', '해바라기 같은', '야심찬', '서툰', '순수한'],
    appearance: ['모델 같은 비율', '우수 어린 눈빛', '항상 미소 짓는', '향수 냄새가 좋은', '세련된 스타일', '강아지상'],
    twist: ['첫사랑을 못 잊음', '비밀 연애 중', '정략 결혼 앞둠', '라이벌 가문의 자녀', '이중 생활 중', '서민 체험 중'],
  }
};

export interface Spark {
  id: number;
  genres: string[];
  job: string;
  personality: string;
  appearance: string;
  twist: string;
  timestamp: string;
  colors: { oklch: string; hex: string }[];
}

class CharacterDataService {
  selectedGenres: Set<string>;
  savedSparks: Spark[];

  constructor() {
    // Default to ALL selected
    this.selectedGenres = new Set(Object.keys(KEYWORD_PACKS));
    this.savedSparks = JSON.parse(localStorage.getItem('mySparks') || '[]');
  }

  toggleGenre(genre: string) {
    if (!KEYWORD_PACKS[genre as keyof typeof KEYWORD_PACKS]) return;
    
    if (this.selectedGenres.has(genre)) {
      this.selectedGenres.delete(genre);
    } else {
      this.selectedGenres.add(genre);
    }
  }

  getRandomKeyword(category: 'job' | 'personality' | 'appearance' | 'twist'): string {
    if (this.selectedGenres.size === 0) return '?';
    
    let pool: string[] = [];
    this.selectedGenres.forEach(genre => {
      pool = pool.concat(KEYWORD_PACKS[genre as keyof typeof KEYWORD_PACKS][category]);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  generateCombination(): Spark {
    return {
      id: Date.now(),
      genres: Array.from(this.selectedGenres),
      job: this.getRandomKeyword('job'),
      personality: this.getRandomKeyword('personality'),
      appearance: this.getRandomKeyword('appearance'),
      twist: this.getRandomKeyword('twist'),
      timestamp: new Date().toISOString(),
      colors: this.generatePalette()
    };
  }

  generatePalette() {
    const baseHue = Math.floor(Math.random() * 360);
    return [
      { oklch: `oklch(70% 0.15 ${baseHue})`, hex: this.hslToHex(baseHue, 70, 60) },
      { oklch: `oklch(60% 0.2 ${(baseHue + 40) % 360})`, hex: this.hslToHex((baseHue + 40) % 360, 80, 50) },
      { oklch: `oklch(50% 0.1 ${(baseHue + 180) % 360})`, hex: this.hslToHex((baseHue + 180) % 360, 50, 40) }
    ];
  }

  hslToHex(h: number, s: number, l: number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  saveSpark(spark: Spark) {
    this.savedSparks.unshift(spark);
    localStorage.setItem('mySparks', JSON.stringify(this.savedSparks));
  }

  deleteSpark(id: number) {
    this.savedSparks = this.savedSparks.filter(s => s.id !== id);
    localStorage.setItem('mySparks', JSON.stringify(this.savedSparks));
  }

  getSavedSparks(): Spark[] {
    return this.savedSparks;
  }
}

export const dataService = new CharacterDataService();
