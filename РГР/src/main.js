import { Analysis } from './modules/Analysis.js';
import { Viewer } from './modules/Viewer.js';
import { Manager } from './modules/Manager.js';

document.addEventListener('DOMContentLoaded', () => {
  const analysis = new Analysis();
  const viewer = new Viewer();
  new Manager(analysis, viewer);
})