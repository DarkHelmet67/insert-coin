import './style.css';
import { getCanvasContext } from '@arcade/render';
import { renderPlaceholder } from './render';

// Step 1 of the remake: an empty playfield, published so every later step can be tried online.
renderPlaceholder(getCanvasContext('#screen'));
