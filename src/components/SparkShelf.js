import { dataService } from '../services/characterData.js';

class SparkShelf extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    window.addEventListener('spark-saved', () => this.render());
  }

  deleteSpark(id) {
    dataService.deleteSpark(id);
    this.render();
  }

  render() {
    const sparks = dataService.getSparks();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: 'Pretendard Variable', sans-serif; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .spark-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 215, 0, 0.1); padding: 1.5rem; border-radius: 1rem; position: relative; transition: all 0.3s; }
        .spark-card:hover { border-color: #FFD700; background: rgba(255, 215, 0, 0.05); }
        .delete-btn { position: absolute; top: 1rem; right: 1rem; cursor: pointer; color: #FF4444; font-size: 0.8rem; opacity: 0.5; transition: opacity 0.2s; border: none; background: none; }
        .delete-btn:hover { opacity: 1; }
        .spark-content { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
        .data-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .data-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.5; font-weight: 700; color: #FFD700; }
        .data-value { font-size: 1rem; font-weight: 600; color: #FFFFFF; }
        .spark-footer { margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .genre-tag { font-size: 0.6rem; padding: 0.2rem 0.6rem; background: rgba(255, 255, 255, 0.1); color: #FFFFFF; border-radius: 1rem; text-transform: uppercase; }
        .empty-state { padding: 4rem; text-align: center; opacity: 0.3; font-size: 1.1rem; letter-spacing: 0.1em; }
      </style>
      <div class="container">
        ${sparks.length === 0 ? `
          <div class="empty-state">ARCHIVE IS EMPTY</div>
        ` : `
          <div class="grid">
            ${sparks.map(s => `
              <div class="spark-card">
                <button class="delete-btn" data-id="${s.id}">DELETE</button>
                <div class="spark-content">
                  <div class="data-item"><span class="data-label">Job</span><span class="data-value">${s.job}</span></div>
                  <div class="data-item"><span class="data-label">Personality</span><span class="data-value">${s.personality}</span></div>
                  <div class="data-item"><span class="data-label">Appearance</span><span class="data-value">${s.appearance}</span></div>
                  <div class="data-item"><span class="data-label">Twist</span><span class="data-value">${s.twist}</span></div>
                </div>
                <div class="spark-footer">
                  ${s.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.deleteSpark(Number(e.target.dataset.id)));
    });
  }
}

customElements.define('spark-shelf', SparkShelf);
