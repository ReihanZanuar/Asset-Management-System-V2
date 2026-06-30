/**
 * Interactive Animations Handler
 * Handles ripple effects, click animations, and other interactive UI enhancements
 */

// Ripple effect on button clicks
function createRipple(event) {
  const button = event.currentTarget;

  // Skip if button is disabled
  if (button.disabled) return;

  // Remove existing ripples
  const existingRipple = button.querySelector('.ripple-effect');
  if (existingRipple) {
    existingRipple.remove();
  }

  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  const rect = button.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple-effect');

  button.appendChild(circle);

  // Remove ripple after animation completes
  setTimeout(() => circle.remove(), 600);
}

// Add ripple effect to all buttons
function initializeRippleEffects() {
  const buttons = document.querySelectorAll('button:not(.no-ripple)');
  buttons.forEach(button => {
    button.addEventListener('click', createRipple);
  });
}

// Animate elements when they come into view
function initializeScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe elements with data-animate attribute
  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach(el => observer.observe(el));
}

// Add smooth scale animation on card hover
function initializeCardAnimations() {
  const cards = document.querySelectorAll('.card-hover, [data-card-hover]');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

// Smooth modal open/close
function enhanceModals() {
  const modals = document.querySelectorAll('[id$="-modal"], [id$="-overlay"]');

  modals.forEach(modal => {
    // Create mutation observer to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const classList = modal.classList;

          // When modal becomes visible
          if (!classList.contains('hidden')) {
            if (!classList.contains('modal-open')) {
              modal.style.display = 'flex';
              // Force reflow for animation
              void modal.offsetWidth;
              modal.classList.add('modal-open');

              // Add animation to modal content
              const content = modal.querySelector('div:first-child');
              if (content) {
                content.classList.add('modal-content');
              }
            }
          } else {
            if (classList.contains('modal-open')) {
              modal.style.display = ''; // Clear inline flex style so hidden class works
              modal.classList.remove('modal-open');
              const content = modal.querySelector('div:first-child');
              if (content) {
                content.classList.remove('modal-content');
              }
            }
          }
        }
      });
    });

    observer.observe(modal, { attributes: true });
  });
}

// Add stagger animation to table rows when they load
function animateTableRows() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'TR') {
          node.style.opacity = '0';
          requestAnimationFrame(() => {
            node.style.transition = 'opacity 0.3s, transform 0.3s';
            node.style.opacity = '1';
          });
        }
      });
    });
  });

  const tbody = document.querySelector('tbody');
  if (tbody) {
    observer.observe(tbody, { childList: true });
  }
}

// Add bounce animation to buttons on click
function initializeButtonBounce() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', function() {
      if (!this.disabled) {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 100);
      }
    });
  });
}

// Add smooth transitions to form inputs
function initializeFormAnimations() {
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.style.transform = 'scale(1.01)';
      this.parentElement?.classList.add('input-focused');
    });

    input.addEventListener('blur', function() {
      this.style.transform = '';
      this.parentElement?.classList.remove('input-focused');
    });
  });
}

// Shake animation for validation errors
function shakeElement(element) {
  element.style.animation = 'shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)';
  setTimeout(() => {
    element.style.animation = '';
  }, 300);
}

// Add shake keyframe if not exists
function addShakeKeyframe() {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
  `;

  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Keyframe might already exist
  }
}

// Initialize all animations when DOM is ready
function initializeAnimations() {
  initializeRippleEffects();
  initializeScrollAnimations();
  initializeCardAnimations();
  enhanceModals();
  animateTableRows();
  initializeButtonBounce();
  initializeFormAnimations();
  addShakeKeyframe();
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnimations);
} else {
  initializeAnimations();
}

// Export functions for external use
window.animationHelpers = {
  createRipple,
  shakeElement,
  initializeRippleEffects
};
