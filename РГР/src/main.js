import './styles/style.scss';
import Analysis from './modules/Analysis.js';
import Viewer from './modules/Viewer.js';

document.addEventListener('DOMContentLoaded', () => {
  const analysis = new Analysis();
  const view = new Viewer();
})