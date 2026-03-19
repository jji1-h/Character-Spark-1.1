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
        :host {
          display: block;
          font-family: 'Inter', sans-serif;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #00FF00;
        }
        .count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          opacity: 0.5;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .spark-card {
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          transition: all 0.2s;
        }
        .spark-card:hover {
          border-color: #00FF00;
          transform: translateY(-4px);
        }
        .spark-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .spark-id {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          opacity: 0.3;
        }
        .delete-btn {
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6rem;
          color: #FF0000;
          opacity: 0.5;
          transition: opacity 0.2s;
          background: none;
          border: none;
          padding: 0;
        }
        .delete-btn:hover {
          opacity: 1;
        }
        .spark-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .data-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .data-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.4;
          font-weight: 700;
        }
        .data-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #FFFFFF;
        }
        .spark-footer {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .genre-tag {
          font-size: 0.5rem;
          padding: 0.2rem 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: 'JetBrains Mono', monospace;
        }
        .empty-state {
          padding: 4rem;
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.2);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
      </style>
      <div class="container">
        <div class="header">
          <div class="title">Archive Repository</div>
          <div class="count">${sparks.length} ITEMS STORED</div>
        </div>
        
        ${sparks.length === 0 ? `
          <div class="empty-state">No data records found in local storage.</div>
        ` : `
          <div class="grid">
            ${sparks.map(s => `
              <div class="spark-card">
                <div class="spark-header">
                  <div class="spark-id">ID: ${s.id}</div>
                  <button class="delete-btn" data-id="${s.id}">[ DELETE ]</button>
                </div>
                <div class="spark-content">
                  <div class="data-item">
                    <span class="data-label">Job</span>
                    <span class="data-value">${s.job}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Personality</span>
                    <span class="data-value">${s.personality}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Appearance</span>
                    <span class="data-value">${s.appearance}</span>
                  </div>
                  <div class="data-item">
                    <span class="data-label">Twist</span>
                    <span class="data-value">${s.twist}</span>
                  </div>
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
      btn.addEventListener('click', (e) => {
        this.deleteSpark(Number(e.target.dataset.id));
      });
    });
  }
}

customElements.define('spark-shelf', SparkShelf);
