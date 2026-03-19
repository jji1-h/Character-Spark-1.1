import { KEYWORD_PACKS, dataService } from '../services/characterData.js';

class GenreSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  toggleAll(checked) {
    if (checked) {
      Object.keys(KEYWORD_PACKS).forEach(g => dataService.selectedGenres.add(g));
    } else {
      dataService.selectedGenres.clear();
    }
    this.render();
    window.dispatchEvent(new CustomEvent('genre-changed', { detail: Array.from(dataService.selectedGenres) }));
  }

  render() {
    const genres = Object.entries(KEYWORD_PACKS);
    const allChecked = dataService.selectedGenres.size === genres.length;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          font-family: 'Pretendard Variable', Pretendard, sans-serif;
        }
        .switcher-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: center;
          background: rgba(37, 22, 63, 0.4);
          padding: 2rem;
          border-radius: 2rem;
          border: 1px solid rgba(255, 215, 0, 0.2);
          backdrop-filter: blur(10px);
        }
        .header {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 215, 0, 0.1);
        }
        .label {
          font-size: 1rem;
          color: #FFD700;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3em;
        }
        .options {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-weight: 600;
          color: #FFFFFF;
          transition: all 0.2s;
          user-select: none;
        }
        .all-toggle {
          color: #FFD700;
          font-weight: 800;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        input[type="checkbox"] {
          appearance: none;
          width: 1.2rem;
          height: 1.2rem;
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 0.4rem;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        input[type="checkbox"]:checked {
          background: #FFD700;
          border-color: #FFD700;
        }
        input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #25163F;
          font-size: 0.8rem;
          font-weight: 900;
        }
      </style>
      <div class="switcher-container">
        <div class="header">
          <div class="label">Magic Realm</div>
          <label class="option all-toggle">
            <input type="checkbox" id="all-select" ${allChecked ? 'checked' : ''}>
            <span>전체 선택</span>
          </label>
        </div>
        <div class="options">
          ${genres.map(([key, pack]) => `
            <label class="option">
              <input type="checkbox" class="genre-checkbox" value="${key}" ${dataService.selectedGenres.has(key) ? 'checked' : ''}>
              <span>${pack.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('all-select').addEventListener('change', (e) => {
      this.toggleAll(e.target.checked);
    });

    this.shadowRoot.querySelectorAll('.genre-checkbox').forEach(input => {
      input.addEventListener('change', (e) => {
        const genre = e.target.value;
        dataService.toggleGenre(genre);
        this.render(); 
        window.dispatchEvent(new CustomEvent('genre-changed', { detail: Array.from(dataService.selectedGenres) }));
      });
    });
  }
}

customElements.define('genre-switcher', GenreSwitcher);
