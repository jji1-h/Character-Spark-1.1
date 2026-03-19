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
    const sparks = dataService.getSavedSparks();
    
    this.shadowRoot.innerHTML = `
      <style>
        .shelf {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 1rem;
        }
        .card {
          background: rgba(255, 255, 255, 0.95);
          color: #25163F;
          border-radius: 1rem;
          padding: 1.5rem;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          border: 2px solid #FFD700;
        }
        .card:hover { transform: translateY(-8px) scale(1.02); }
        .delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: transparent;
          border: none;
          color: rgba(37, 22, 63, 0.3);
          cursor: pointer;
          font-size: 1.5rem;
          transition: color 0.2s;
        }
        .delete-btn:hover { color: #ff4444; }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(37, 22, 63, 0.1);
          padding-bottom: 0.5rem;
        }
        .genre-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .genre-badge {
          font-size: 0.6rem;
          background: #3B167C;
          padding: 0.2rem 0.5rem;
          border-radius: 2rem;
          text-transform: uppercase;
          color: #FFD700;
          font-weight: 800;
        }
        .keywords {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          font-family: 'Georgia', serif;
        }
        .kw {
          font-weight: 900;
          font-size: 1.1rem;
        }
        .kw span {
          font-size: 0.65rem;
          color: rgba(37, 22, 63, 0.5);
          margin-right: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: inline-block;
          width: 50px;
        }
        .empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 5rem;
          color: rgba(255, 255, 255, 0.5);
          border: 2px dashed rgba(255, 215, 0, 0.3);
          border-radius: 2rem;
          text-transform: uppercase;
          letter-spacing: 0.3em;
        }
      </style>
      <div class="shelf">
        ${sparks.length === 0 ? '<div class="empty">The archives are empty. Find your spark.</div>' : 
          sparks.map(spark => `
            <div class="card">
              <button class="delete-btn" data-id="${spark.id}">×</button>
              <div class="card-header">
                <div class="genre-badges">
                  ${(spark.genres || []).map(g => `<span class="genre-badge">${g}</span>`).join('')}
                </div>
              </div>
              <div class="keywords">
                <div class="kw"><span>성격</span>${spark.personality}</div>
                <div class="kw"><span>직업</span>${spark.job}</div>
                <div class="kw"><span>외모특성</span>${spark.appearance}</div>
                <div class="kw"><span>반전매력</span>${spark.twist}</div>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.deleteSpark(Number(e.target.dataset.id));
      });
    });
  }
}

customElements.define('my-spark-shelf', SparkShelf);
