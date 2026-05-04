/**
 * Slide Engine - Lightweight Presentation Framework
 * Click/keyboard to advance slides, supports fragments and fullscreen
 */

class SlideEngine {
  constructor(options = {}) {
    this.currentSlide = 0;
    this.slides = [];
    this.fragments = [];
    this.currentFragment = -1;
    this.isAnimating = false;
    this.options = {
      transition: options.transition || 'slide',
      hashNavigation: options.hashNavigation !== false,
      progressBar: options.progressBar !== false,
      slideNumbers: options.slideNumbers !== false,
      clickToAdvance: options.clickToAdvance !== false,
      ...options
    };

    this.init();
  }

  init() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    if (this.slides.length === 0) return;

    this.createUI();
    this.bindEvents();
    this.goToSlide(this.getInitialSlide());
  }

  createUI() {
    // Progress bar
    if (this.options.progressBar) {
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'slide-progress';
      document.body.appendChild(this.progressBar);
    }

    // Slide number
    if (this.options.slideNumbers) {
      this.slideNumber = document.createElement('div');
      this.slideNumber.className = 'slide-number';
      document.body.appendChild(this.slideNumber);
    }

    // Fullscreen button
    this.fullscreenBtn = document.createElement('button');
    this.fullscreenBtn.className = 'fullscreen-btn';
    this.fullscreenBtn.innerHTML = '⛶';
    this.fullscreenBtn.title = 'Toggle Fullscreen (F)';
    document.body.appendChild(this.fullscreenBtn);
  }

  bindEvents() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Click to advance
    if (this.options.clickToAdvance) {
      document.addEventListener('click', (e) => {
        if (e.target.closest('a, button, .no-advance')) return;
        this.next();
      });
    }

    // Touch support
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });
    document.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.prev() : this.next();
      }
    });

    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFullscreen();
    });

    // Hash change
    if (this.options.hashNavigation) {
      window.addEventListener('hashchange', () => {
        const slide = this.getSlideFromHash();
        if (slide !== this.currentSlide) this.goToSlide(slide);
      });
    }
  }

  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        this.prev();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.slides.length - 1);
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  }

  next() {
    if (this.isAnimating) return;

    // Check for fragments first
    const currentFragments = this.slides[this.currentSlide].querySelectorAll('.fragment:not(.visible)');
    if (currentFragments.length > 0) {
      currentFragments[0].classList.add('visible');
      return;
    }

    if (this.currentSlide < this.slides.length - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  prev() {
    if (this.isAnimating) return;

    // Check for visible fragments first
    const visibleFragments = this.slides[this.currentSlide].querySelectorAll('.fragment.visible');
    if (visibleFragments.length > 0) {
      visibleFragments[visibleFragments.length - 1].classList.remove('visible');
      return;
    }

    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  goToSlide(index) {
    if (index < 0 || index >= this.slides.length || index === this.currentSlide && this.slides[index].classList.contains('active')) return;

    this.isAnimating = true;

    // Remove previous states
    this.slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev');
      // Reset fragments
      slide.querySelectorAll('.fragment').forEach(f => f.classList.remove('visible'));
    });

    // Mark slides before current as 'prev'
    for (let i = 0; i < index; i++) {
      this.slides[i].classList.add('prev');
    }

    // Activate current slide
    this.slides[index].classList.add('active');
    this.currentSlide = index;

    // Update UI
    this.updateProgress();
    this.updateHash();

    setTimeout(() => { this.isAnimating = false; }, 600);
  }

  updateProgress() {
    const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
    
    if (this.progressBar) {
      this.progressBar.style.width = `${progress}%`;
    }
    
    if (this.slideNumber) {
      this.slideNumber.textContent = `${this.currentSlide + 1} / ${this.slides.length}`;
    }
  }

  updateHash() {
    if (this.options.hashNavigation) {
      const slideId = this.slides[this.currentSlide].id || (this.currentSlide + 1);
      history.replaceState(null, null, `#${slideId}`);
    }
  }

  getInitialSlide() {
    return this.getSlideFromHash() || 0;
  }

  getSlideFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return 0;
    
    // Try by ID first
    const byId = this.slides.findIndex(s => s.id === hash);
    if (byId !== -1) return byId;
    
    // Try by number
    const num = parseInt(hash) - 1;
    if (num >= 0 && num < this.slides.length) return num;
    
    return 0;
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.slideEngine = new SlideEngine();
});
