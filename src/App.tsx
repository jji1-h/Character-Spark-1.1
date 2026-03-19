import { useEffect } from 'react';
import './components/GenreSwitcher';
import './components/CharacterCards';
import './components/SparkShelf';
import './components/AmbientBackground';

export default function App() {
  useEffect(() => {
    // Any global initialization logic if needed
  }, []);

  return (
    <div id="app">
      <ambient-background></ambient-background>
      <header>
        <h1>Character Spark</h1>
        <p>창작자를 위한 캐릭터 영감 엔진</p>
      </header>

      <main>
        <section className="generator-area">
          <div className="controls">
            <genre-switcher></genre-switcher>
          </div>
          
          <character-cards></character-cards>
        </section>

        <section className="storage-area">
          <h2>My Sparks (보관함)</h2>
          <my-spark-shelf></my-spark-shelf>
        </section>
      </main>

      <footer>
        <p>&copy; 2024 Character Spark. Create something amazing.</p>
      </footer>
    </div>
  );
}
