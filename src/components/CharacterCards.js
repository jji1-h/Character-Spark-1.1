import { dataService } from '../services/characterData.js';
import { GoogleGenAI } from "@google/genai";

class CharacterCards extends HTMLElement {
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
    this.isGeneratingAI = false;
  }

  connectedCallback() {
    this.render();
  }

  showModal(message) {
    const modal = this.shadowRoot.getElementById('alert-modal');
    const modalMsg = this.shadowRoot.getElementById('modal-message');
    modalMsg.textContent = message;
    modal.classList.add('show');
  }

  closeModal() {
    this.shadowRoot.getElementById('alert-modal').classList.remove('show');
  }

  async flipCard(category) {
    if (dataService.selectedGenres.size === 0) {
      this.showModal("하나 이상의 장르를 선택해 주세요.");
      return;
    }

    const card = this.shadowRoot.querySelector(`.card[data-cat="${category}"]`);
    const back = card.querySelector('.back');

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

  updateCardBack(category, backElement) {
    const count = this.redrawCounts[category];
    const labelMap = {
      job: '직업',
      personality: '성격',
      appearance: '외모특성',
      twist: '반전매력'
    };

    backElement.innerHTML = `
      <div class="redraw-overlay">
        <div>REDRAW</div>
        <div class="redraw-count">(${count}/3)</div>
      </div>
      <div class="result-text">${this.sparkData[category]}</div>
      <div class="card-footer">${labelMap[category]}</div>
    `;
  }

  async resetAll() {
    const cards = this.shadowRoot.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('is-flipped'));

    await new Promise(r => setTimeout(r, 600));

    this.sparkData = { job: '?', personality: '?', appearance: '?', twist: '?' };
    this.flippedStates = { job: false, personality: false, appearance: false, twist: false };
    this.redrawCounts = { job: 0, personality: 0, appearance: 0, twist: 0 };
    this.currentSpark = null;

    this.shadowRoot.querySelector('.save-btn').disabled = true;
    this.shadowRoot.querySelector('.ai-btn').disabled = true;
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
      this.shadowRoot.querySelector('.save-btn').disabled = false;
      this.shadowRoot.querySelector('.ai-btn').disabled = false;
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
    const aiBtn = this.shadowRoot.querySelector('.ai-btn');
    aiBtn.textContent = "AI ANALYZING...";
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
    const categories = [
      { id: 'job', label: '직업', icon: '✦' },
      { id: 'personality', label: '성격', icon: '✧' },
      { id: 'appearance', label: '외모특성', icon: '❂' },
      { id: 'twist', label: '반전매력', icon: '✵' }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          font-family: 'Inter', sans-serif;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          perspective: 2000px;
          width: 100%;
        }
        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
        }
        .card-scene {
          aspect-ratio: 2/3;
          cursor: pointer;
        }
        .card {
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
          position: relative;
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          box-sizing: border-box;
          transition: all 0.3s;
        }
        
        .front {
          background: #141414;
          color: #FFFFFF;
        }
        .front:hover {
          border-color: #00FF00;
          box-shadow: 0 0 30px rgba(0, 255, 0, 0.2);
        }

        .back {
          background: #00FF00;
          color: #000000;
          transform: rotateY(180deg);
          padding: 1.5rem;
          text-align: center;
          position: relative;
        }
        
        .redraw-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          color: #00FF00;
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
          font-family: 'JetBrains Mono', monospace;
        }
        .redraw-count {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        .back:hover .redraw-overlay {
          opacity: 1;
        }

        .result-text {
          font-weight: 900;
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          line-height: 1.2;
          word-break: keep-all;
          text-transform: uppercase;
        }
        .card-footer {
          position: absolute;
          bottom: 1.5rem;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          font-weight: 700;
          opacity: 0.5;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }
        .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
        .cat-label { font-weight: 800; letter-spacing: 0.3em; font-size: 0.7rem; text-transform: uppercase; font-family: 'JetBrains Mono', monospace; }
        
        .footer-controls {
          display: flex;
          gap: 1rem;
          margin-top: 4rem;
          width: 100%;
          justify-content: flex-start;
        }
        
        .control-btn {
          height: 4rem;
          padding: 0 2rem;
          border-radius: 0;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-transform: uppercase;
          font-family: 'JetBrains Mono', monospace;
        }

        .redraw-btn {
          background: transparent;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .redraw-btn:hover {
          border-color: #00FF00;
          color: #00FF00;
        }

        .save-btn {
          background: #00FF00;
          color: #000000;
          border: none;
        }
        .save-btn:hover:not(:disabled) {
          background: #FFFFFF;
        }
        .save-btn:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
        }

        .ai-btn {
          background: #FFFFFF;
          color: #000000;
          border: none;
        }
        .ai-btn:hover:not(:disabled) {
          background: #00FF00;
        }
        .ai-btn:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
        }

        #alert-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        #alert-modal.show { display: flex; }
        .modal-content {
          background: #141414;
          border: 1px solid #00FF00;
          padding: 4rem;
          text-align: left;
          max-width: 600px;
          width: 90%;
        }
        .modal-message {
          color: #FFFFFF;
          font-weight: 400;
          margin-bottom: 3rem;
          font-size: 1.2rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .modal-close {
          background: #00FF00;
          color: #000000;
          border: none;
          padding: 1rem 2rem;
          font-weight: 800;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.2em;
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
                  <div>REDRAW</div>
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
          <span>Reset All</span>
        </button>
        <button class="control-btn ai-btn" disabled>
          <span class="btn-icon">✨</span>
          <span>AI Backstory</span>
        </button>
        <button class="control-btn save-btn" disabled>
          <span class="btn-icon">★</span>
          <span>Archive Spark</span>
        </button>
      </div>

      <div id="alert-modal">
        <div class="modal-content">
          <div class="modal-message" id="modal-message">하나 이상의 장르를 선택해 주세요.</div>
          <button class="modal-close">Close</button>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.card-scene').forEach(scene => {
      scene.addEventListener('click', () => {
        this.flipCard(scene.dataset.id);
      });
    });

    this.shadowRoot.querySelector('.redraw-btn').addEventListener('click', () => {
      this.resetAll();
    });

    this.shadowRoot.querySelector('.save-btn').addEventListener('click', () => {
      this.saveCurrent();
    });

    this.shadowRoot.querySelector('.ai-btn').addEventListener('click', () => {
      this.generateAIBackstory();
    });

    this.shadowRoot.querySelector('.modal-close').addEventListener('click', () => {
      this.closeModal();
    });
  }
}

customElements.define('character-cards', CharacterCards);
