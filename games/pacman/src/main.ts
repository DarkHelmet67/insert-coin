import './style.css';
import { clearScreen, getCanvasContext } from '@arcade/render';

const ctx = getCanvasContext('#screen');

// The first step only opens the page: the cabinet's black screen.
clearScreen(ctx);
