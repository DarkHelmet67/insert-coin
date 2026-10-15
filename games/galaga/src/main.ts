import './style.css';
import { arcadeFont, clearScreen, drawCenteredText, getCanvasContext } from '@arcade/render';

const ctx = getCanvasContext('#screen');

// Placeholder while the game is being built: the title on a black screen.
clearScreen(ctx);
drawCenteredText(ctx, arcadeFont, 'GALAGA', 136, '#00a0ff');
