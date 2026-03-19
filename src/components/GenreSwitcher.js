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
          font-family: "Inter", sans-serif;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .label {
          font-family: "JetBrains Mono", monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #00FF00;
        }
        .all-toggle {
          cursor: pointer;
          font-family: "JetBrains Mono", monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          color: #FFFFFF;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .all-toggle:hover {
          opacity: 1;
        }
        .options {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }
        .option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
        }
        .option:hover {
          background: rgba(0, 255, 0, 0.05);
          border-color: #00FF00;
        }
        .option.active {
          background: #00FF00;
          color: #000000;
          border-color: #00FF00;
        }
        .option input {
          display: none;
        }
        .option-label {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      </style>
      <div class="container">
        <div class="header">
          <div class="label">Genre Matrix</div>
          <div class="all-toggle" id="all-select">
            ${allChecked ? '[ Deselect All ]' : '[ Select All ]'}
          </div>
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
