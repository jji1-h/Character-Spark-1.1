import { dataService, Spark } from '../services/characterData';
import { GoogleGenAI } from "@google/genai";

class CharacterCards extends HTMLElement {
  sparkData: { job: string; personality: string; appearance: string; twist: string };
  flippedStates: { job: boolean; personality: boolean; appearance: boolean; twist: boolean };
  redrawCounts: { job: number; personality: number; appearance: number; twist: number };
  currentSpark: Spark | null;
  isGeneratingAI: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sparkData = {
      job: '?', personality: '?', appearance: '?', twist: '?'
    };
    this.flippedStates = {
      job: false, personality: false, appearance: false, twist: false
    };
    this.redrawCounts = {
      job: 0, personality: 0, appearance: 0, twist: 0
    };
    this.currentSpark = null;
  }

  connectedCallback() {
    this.render();
  }

  showModal(message: string) {
    const modal = this.shadowRoot!.getElementById('alert-modal')!;
    const modalMsg = this.shadowRoot!.getElementById('modal-message')!;
    modalMsg.textContent = message;
    modal.classList.add('show');
  }

  closeModal() {
    this.shadowRoot!.getElementById('alert-modal')!.classList.remove('show');
  }

  async flipCard(category: 'job' | 'personality' | 'appearance' | 'twist') {
    if (dataService.selectedGenres.size === 0) {
      this.showModal("하나 이상의 장르를 선택해 주세요.");
      return;
    }

    const card = this.shadowRoot!.querySelector(`.card[data-cat="${category}"]`) as HTMLElement;
    const back = card.querySelector('.back') as HTMLElement;

    if (this.flippedStates[category]) {
      if (this.redrawCounts[category] >= 3) {
        this.showModal("이 카드는 더 이상 다시 뽑을 수 없습니다. (최대 3회)");
        return;
      }
      
      this.redrawCounts[category]++;
      card.classList.remove('is-flipped');
      await new Promise(r => setTimeout(r, 400));
    }

    this.sparkData[category] = dataService.getRandomKeyword(category);
    this.updateCardBack(category, back);
    
    card.classList.add('is-flipped');
    this.flippedStates[category] = true;

    this.checkCompletion();
  }

  updateCardBack(category: 'job' | 'personality' | 'appearance' | 'twist', backElement: HTMLElement) {
    const count = this.redrawCounts[category];
    const labelMap = {
      job: '직업',
      personality: '성격',
      appearance: '외모특성',
      twist: '반전매력'
    };

    backElement.innerHTML = `
      <div class="redraw-overlay">
        <div>이 카드만 다시 뽑기</div>
        <div class="redraw-count">(${count}/3)</div>
      </div>
      <div class="result-text">${this.sparkData[category]}</div>
      <div class="card-footer">${labelMap[category]}</div>
    `;
  }

  async resetAll() {
    const cards = this.shadowRoot!.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('is-flipped'));

    await new Promise(r => setTimeout(r, 600));

    this.sparkData = { job: '?', personality: '?', appearance: '?', twist: '?' };
    this.flippedStates = { job: false, personality: false, appearance: false, twist: false };
    this.redrawCounts = { job: 0, personality: 0, appearance: 0, twist: 0 };
    this.currentSpark = null;

    (this.shadowRoot!.querySelector('.save-btn') as HTMLButtonElement).disabled = true;
    (this.shadowRoot!.querySelector('.ai-btn') as HTMLButtonElement).disabled = true;
    this.render();
  }

  checkCompletion() {
    const allFlipped = Object.values(this.flippedStates).every(v => v === true);
    if (allFlipped) {
      this.currentSpark = {
        id: Date.now(),
        genres: Array.from(dataService.selectedGenres),
        ...this.sparkData,
        timestamp: new Date().toISOString(),
        colors: dataService.generatePalette()
      };
      (this.shadowRoot!.querySelector('.save-btn') as HTMLButtonElement).disabled = false;
      (this.shadowRoot!.querySelector('.ai-btn') as HTMLButtonElement).disabled = false;
      window.dispatchEvent(new CustomEvent('spark-complete', { detail: this.currentSpark }));
    }
  }

  saveCurrent() {
    if (this.currentSpark) {
      dataService.saveSpark(this.currentSpark);
      window.dispatchEvent(new CustomEvent('spark-saved'));
      this.showModal("보관함에 저장되었습니다!");
    }
  }

  async generateAIBackstory() {
    if (!this.currentSpark || this.isGeneratingAI) return;

    this.isGeneratingAI = true;
    const aiBtn = this.shadowRoot!.querySelector('.ai-btn') as HTMLButtonElement;
    aiBtn.textContent = "AI 분석 중...";
    aiBtn.disabled = true;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        this.showModal("GEMINI_API_KEY가 설정되지 않았습니다. 설정에서 API 키를 추가해 주세요.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        다음 키워드를 바탕으로 매력적인 캐릭터 배경 설정을 3문장 이내로 작성해줘.
        키워드:
        - 성격: ${this.currentSpark.personality}
        - 직업: ${this.currentSpark.job}
        - 외모: ${this.currentSpark.appearance}
        - 반전: ${this.currentSpark.twist}
        
        캐릭터의 매력이 돋보이도록 창의적으로 작성해줘.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const backstory = response.text || "AI가 배경 설정을 생성하지 못했습니다.";
      this.showModal(backstory);
    } catch (error) {
      console.error("AI Error:", error);
      this.showModal("AI 연결에 실패했습니다. API 키를 확인해 주세요.");
    } finally {
      this.isGeneratingAI = false;
      aiBtn.innerHTML = `<span class="btn-icon">✨</span><span>AI 배경 설정</span>`;
      aiBtn.disabled = false;
    }
  }

  render() {
    const categories: { id: 'job' | 'personality' | 'appearance' | 'twist'; label: string; icon: string }[] = [
      { id: 'job', label: '직업', icon: '✦' },
      { id: 'personality', label: '성격', icon: '✧' },
      { id: 'appearance', label: '외모특성', icon: '❂' },
      { id: 'twist', label: '반전매력', icon: '✵' }
    ];

    this.shadowRoot!.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          font-family: 'Pretendard Variable', Pretendard, sans-serif;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5rem;
          perspective: 2000px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(2, 2fr);
            gap: 1.5rem;
          }
        }
        .card-scene {
          aspect-ratio: 2/3.2;
          cursor: pointer;
        }
        .card {
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
          position: relative;
        }
        
        .card-scene:hover .card:not(.is-flipped) {
          transform: translateY(-15px) rotateX(10deg);
          box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
        }
        
        .card.is-flipped {
          transform: rotateY(180deg);
        }
        .face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 1.2rem;
          border: 2px solid #FFD700;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          overflow: hidden;
          box-sizing: border-box;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .card-scene:hover .face.front {
          border-color: #FFFFFF;
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
        }

        .front {
          background: linear-gradient(135deg, #25163F, #3B167C);
          color: #FFD700;
        }
        .back {
          background: #FFFFFF;
          color: #25163F;
          transform: rotateY(180deg);
          padding: 1.5rem;
          text-align: center;
          position: relative;
        }
        
        .redraw-overlay {
          position: absolute;
          inset: 0;
          background: rgba(37, 22, 63, 0.9);
          color: #FFD700;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          gap: 0.5rem;
        }
        .redraw-count {
          font-size: 0.75rem;
          opacity: 0.8;
          font-weight: 600;
        }
        .back:hover .redraw-overlay {
          opacity: 1;
        }

        .result-text {
          font-weight: 800;
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          line-height: 1.4;
          word-break: keep-all;
        }
        .card-footer {
          position: absolute;
          bottom: 1.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          font-weight: 700;
          opacity: 0.5;
        }
        .icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
        .cat-label { font-weight: 800; letter-spacing: 0.3em; font-size: 0.8rem; }
        
        /* Footer Button Layout */
        .footer-controls {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-top: 4rem;
          width: 100%;
          flex-wrap: wrap;
        }
        
        .control-btn {
          height: 3.5rem;
          min-width: 160px;
          flex: 1;
          max-width: 240px;
          border-radius: 3rem;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          text-transform: uppercase;
        }

        /* Outline Style for Reset */
        .redraw-btn {
          background: transparent;
          color: #FFD700;
          border: 2px solid #FFD700;
        }
        .redraw-btn:hover {
          background: rgba(255, 215, 0, 0.1);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
          transform: translateY(-2px);
        }

        /* Solid Style for Save */
        .save-btn {
          background: #FFD700;
          color: #25163F;
          border: none;
          box-shadow: 0 10px 25px rgba(255, 215, 0, 0.3);
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 15px 35px rgba(255, 215, 0, 0.4);
        }
        .save-btn:disabled {
          background: rgba(255, 215, 0, 0.15);
          color: rgba(255, 215, 0, 0.3);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* AI Button Style */
        .ai-btn {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #25163F;
          border: none;
          box-shadow: 0 10px 25px rgba(255, 215, 0, 0.3);
        }
        .ai-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 15px 35px rgba(255, 215, 0, 0.4);
        }
        .ai-btn:disabled {
          background: rgba(255, 215, 0, 0.15);
          color: rgba(255, 215, 0, 0.3);
          box-shadow: none;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 1.2rem;
        }

        /* Modal Styles */
        #alert-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        #alert-modal.show { display: flex; }
        .modal-content {
          background: #3B167C;
          border: 2px solid #FFD700;
          padding: 2.5rem;
          border-radius: 2rem;
          text-align: center;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
        }
        .modal-message {
          color: #FFFFFF;
          font-weight: 700;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .modal-close {
          background: #FFD700;
          color: #25163F;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 1rem;
          font-weight: 800;
          cursor: pointer;
        }
      </style>

      <div class="grid">
        ${categories.map(cat => `
          <div class="card-scene" data-id="${cat.id}">
            <div class="card" data-cat="${cat.id}">
              <div class="face front">
                <div class="icon">${cat.icon}</div>
                <div class="cat-label">${cat.label}</div>
              </div>
              <div class="face back" data-cat="${cat.id}">
                <div class="redraw-overlay">
                  <div>이 카드만 다시 뽑기</div>
                  <div class="redraw-count">(0/3)</div>
                </div>
                <div class="result-text">?</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="footer-controls">
        <button class="control-btn redraw-btn">
          <span class="btn-icon">↺</span>
          <span>전체 다시 뽑기</span>
        </button>
        <button class="control-btn ai-btn" disabled>
          <span class="btn-icon">✨</span>
          <span>AI 배경 설정</span>
        </button>
        <button class="control-btn save-btn" disabled>
          <span class="btn-icon">★</span>
          <span>보관하기</span>
        </button>
      </div>

      <div id="alert-modal">
        <div class="modal-content">
          <div class="modal-message" id="modal-message">하나 이상의 장르를 선택해 주세요.</div>
          <button class="modal-close">확인</button>
        </div>
      </div>
    `;

    this.shadowRoot!.querySelectorAll('.card-scene').forEach(scene => {
      scene.addEventListener('click', () => {
        this.flipCard((scene as HTMLElement).dataset.id as any);
      });
    });

    this.shadowRoot!.querySelector('.redraw-btn')!.addEventListener('click', () => {
      this.resetAll();
    });

    this.shadowRoot!.querySelector('.save-btn')!.addEventListener('click', () => {
      this.saveCurrent();
    });

    this.shadowRoot!.querySelector('.ai-btn')!.addEventListener('click', () => {
      this.generateAIBackstory();
    });

    this.shadowRoot!.querySelector('.modal-close')!.addEventListener('click', () => {
      this.closeModal();
    });
  }
}

customElements.define('character-cards', CharacterCards);
