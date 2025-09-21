// Keyboard/mouse input state tracking
// Manages input state and provides clean interface for game systems
// Handles tower rotation controls and UI interactions
export class Input {
  private keys: Map<string, boolean> = new Map();
  private mouse: { x: number; y: number; down: boolean; clicked: boolean } = { x: 0, y: 0, down: false, clicked: false };
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      this.keys.set(event.code, true);
    });

    document.addEventListener('keyup', (event) => {
      this.keys.set(event.code, false);
    });

    // Mouse events
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (event) => {
      this.mouse.down = true;
      event.preventDefault();
    });

    this.canvas.addEventListener('mouseup', (event) => {
      if (this.mouse.down) {
        this.mouse.clicked = true; // Set clicked flag when mouse is released after being down
      }
      this.mouse.down = false;
      event.preventDefault();
    });

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  /** Check if a key is currently pressed */
  isKeyDown(keyCode: string): boolean {
    return this.keys.get(keyCode) || false;
  }

  /** Get current mouse position relative to canvas */
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /** Check if mouse button is down */
  isMouseDown(): boolean {
    return this.mouse.down;
  }

  /** Check if mouse was clicked this frame (consume the click) */
  wasMouseClicked(): boolean {
    if (this.mouse.clicked) {
      this.mouse.clicked = false; // Clear the flag after reading
      return true;
    }
    return false;
  }

  /** Get current mouse position for click handling */
  getMouseClick(): { x: number; y: number; clicked: boolean } {
    const clicked = this.mouse.clicked;
    if (clicked) {
      this.mouse.clicked = false; // Clear the flag after reading
    }
    return { x: this.mouse.x, y: this.mouse.y, clicked };
  }

  /** Calculate angle from point to mouse position */
  getAngleToMouse(fromX: number, fromY: number): number {
    const dx = this.mouse.x - fromX;
    const dy = this.mouse.y - fromY;
    return Math.atan2(dy, dx);
  }

  /** Get keyboard input for turret rotation (-1, 0, 1) */
  getTurretRotationInput(): number {
    let rotation = 0;
    if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) {
      rotation -= 1;
    }
    if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) {
      rotation += 1;
    }
    return rotation;
  }

  /** Get current input state for debugging */
  getDebugState(): any {
    const pressedKeys = Array.from(this.keys.entries())
      .filter(([key, pressed]) => pressed)
      .map(([key]) => key);

    return {
      pressedKeys,
      mouse: this.mouse,
      turretRotation: this.getTurretRotationInput()
    };
  }
}