import * as THREE from 'three';

class AmbientBackground extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.animationId = null;
  }

  connectedCallback() {
    this.render();
    this.initThree();
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('spark-complete', this.onSparkComplete.bind(this));
  }

  disconnectedCallback() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize.bind(this));
    window.removeEventListener('spark-complete', this.onSparkComplete.bind(this));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.shadowRoot.appendChild(this.renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({ color: 0xFFD700, size: 2, transparent: true, opacity: 0.5 });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    this.camera.position.z = 500;

    this.runAnimationLoop();
  }

  onResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  onSparkComplete(event) {
    if (!this.particles) return;
    const colors = event.detail.colors;
    if (colors && colors.length > 0) {
      const color = new THREE.Color(colors[0].hex);
      this.particles.material.color = color;
      
      // Pulse effect
      const originalSize = 2;
      let scale = 1;
      const pulse = () => {
        scale += 0.1;
        if (this.particles) {
          this.particles.material.size = originalSize * scale;
        }
        if (scale < 3) requestAnimationFrame(pulse);
        else {
          const shrink = () => {
             scale -= 0.1;
             if (this.particles) {
               this.particles.material.size = originalSize * scale;
             }
             if (scale > 1) requestAnimationFrame(shrink);
          };
          shrink();
        }
      };
      pulse();
    }
  }

  runAnimationLoop() {
    this.animationId = requestAnimationFrame(this.runAnimationLoop.bind(this));
    if (this.particles) {
      this.particles.rotation.x += 0.0005;
      this.particles.rotation.y += 0.001;
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          pointer-events: none;
        }
        canvas {
          display: block;
        }
      </style>
    `;
  }
}

customElements.define('ambient-background', AmbientBackground);
