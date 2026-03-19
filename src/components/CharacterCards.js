import { dataService } from '../services/characterData.js';
import { GoogleGenAI } from "@google/genai";

class CharacterCards extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sparkData = { job: '?', personality: '?', appearance: '?', twist: '?' };
    this.flippedStates = { job: false, personality: false, appearance: false, twist: false };
    this.redrawCounts = { job: 0, personality: 0, appearance: 0, twist: 0 };
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
    const labelMap = { job: '직업', personality: '성격', appearance: '외모특성', twist: '반전매력' };

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
        this.showModal("GEMINI_API_KEY가 설정되지 않았습니다.");
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
      `;
      const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
      this.showModal(response.text || "AI가 배경 설정을 생성하지 못했습니다.");
    } catch (error) {
      this.showModal("AI 연결에 실패했습니다.");
    } finally {
      this.isGeneratingAI = false;
      aiBtn.innerHTML = `AI 배경 설정`;
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
        :host { display: block; width: 100%; font-family: 'Pretendard Variable', sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; perspective: 1000px; }
        @media (max-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
        .card-scene { aspect-ratio: 2/3; cursor: pointer; }
        .card { width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; }
        .card.is-flipped { transform: rotateY(180deg); }
        .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid rgba(255, 215, 0, 0.2); border-radius: 1rem; overflow: hidden; box-sizing: border-box; background: rgba(255, 255, 255, 0.05); }
        .front { color: #FFD700; }
        .front:hover { background: rgba(255, 215, 0, 0.1); border-color: #FFD700; }
        .back { background: #FFD700; color: #000000; transform: rotateY(180deg); padding: 1rem; text-align: center; }
        .redraw-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.8); color: #FFD700; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; opacity: 0; transition: opacity 0.2s; z-index: 10; letter-spacing: 0.1em; }
        .back:hover .redraw-overlay { opacity: 1; }
        .result-text { font-weight: 900; font-size: 1.5rem; line-height: 1.2; word-break: keep-all; }
        .card-footer { position: absolute; bottom: 1rem; font-size: 0.6rem; letter-spacing: 0.2em; font-weight: 700; opacity: 0.5; text-transform: uppercase; }
        .icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .cat-label { font-weight: 800; letter-spacing: 0.2em; font-size: 0.7rem; text-transform: uppercase; }
        .footer-controls { display: flex; gap: 1rem; margin-top: 3rem; width: 100%; justify-content: center; }
        .control-btn { padding: 1rem 2rem; border-radius: 3rem; font-size: 0.9rem; font-weight: 800; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s; border: none; text-transform: uppercase; }
        .redraw-btn { background: rgba(255, 255, 255, 0.1); color: #FFFFFF; }
        .redraw-btn:hover { background: rgba(255, 255, 255, 0.2); }
        .save-btn { background: #FFD700; color: #000000; }
        .save-btn:hover:not(:disabled) { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
        .ai-btn { background: #FFFFFF; color: #000000; }
        .ai-btn:hover:not(:disabled) { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
        .control-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        #alert-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 1000; }
        #alert-modal.show { display: flex; }
        .modal-content { background: #1a1a1a; border: 1px solid #FFD700; padding: 2.5rem; text-align: center; border-radius: 1.5rem; max-width: 500px; width: 90%; }
        .modal-message { color: #FFFFFF; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6; white-space: pre-wrap; }
        .modal-close { background: #FFD700; color: #000000; border: none; padding: 0.8rem 2rem; font-weight: 800; border-radius: 2rem; cursor: pointer; }
      </style>
      <div class="grid">
        ${categories.map(cat => `
          <div class="card-scene" data-id="${cat.id}">
            <div class="card" data-cat="${cat.id}">
              <div class="face front">
                <div class="icon">${cat.icon}</div>
                <div class="cat-label">${cat.label}</div>
              </div>
              <div class="face back">
                <div class="redraw-overlay"><div>REDRAW</div><div class="redraw-count">(0/3)</div></div>
                <div class="result-text">?</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="footer-controls">
        <button class="control-btn redraw-btn">RESET ALL</button>
        <button class="control-btn ai-btn" disabled>AI 배경 설정</button>
        <button class="control-btn save-btn" disabled>ARCHIVE SPARK</button>
      </div>
      <div id="alert-modal"><div class="modal-content"><div class="modal-message" id="modal-message"></div><button class="modal-close">CLOSE</button></div></div>
    `;

    this.shadowRoot.querySelectorAll('.card-scene').forEach(scene => {
      scene.addEventListener('click', () => this.flipCard(scene.dataset.id));
    });
    this.shadowRoot.querySelector('.redraw-btn').addEventListener('click', () => this.resetAll());
    this.shadowRoot.querySelector('.save-btn').addEventListener('click', () => this.saveCurrent());
    this.shadowRoot.querySelector('.ai-btn').addEventListener('click', () => this.generateAIBackstory());
    this.shadowRoot.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
  }
}
customElements.define('character-cards', CharacterCards);
