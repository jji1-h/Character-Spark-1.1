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
          display: block;
          font-family: 'Pretendard Variable', sans-serif;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .all-toggle {
          cursor: pointer;
          font-size: 0.8rem;
          text-transform: uppercase;
          color: #FFD700;
          opacity: 0.6;
          transition: opacity 0.2s;
          letter-spacing: 0.2em;
          border: 1px solid rgba(255, 215, 0, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
        }
        .all-toggle:hover {
          opacity: 1;
          background: rgba(255, 215, 0, 0.1);
        }
        .options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          width: 100%;
        }
        .option {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.8rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s;
          user-select: none;
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
        }
        .option:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .option.active {
          background: #FFD700;
          color: #000000;
          border-color: #FFD700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
        .option input {
          display: none;
        }
        .option-label {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
      </style>
      <div class="container">
        <div class="all-toggle" id="all-select">
          ${allChecked ? 'DESELECT ALL' : 'SELECT ALL GENRES'}
        </div>
        <div class="options">
          ${genres.map(([key, pack]) => {
            const isActive = dataService.selectedGenres.has(key);
            return `
              <label class="option ${isActive ? 'active' : ''}">
                <input type="checkbox" class="genre-checkbox" value="${key}" ${isActive ? 'checked' : ''}>
                <span class="option-label">${pack.label}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('all-select').addEventListener('click', () => {
      this.toggleAll(!allChecked);
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
