import { initTelegram } from './telegram.js';
import { InputManager } from './input.js';
import { GameManager } from './game.js';

// Init Telegram features
initTelegram();

// State Elements
const screenMenu = document.getElementById('screen-menu');
const screenSelect = document.getElementById('screen-select');
const screenVs = document.getElementById('screen-vs');
const screenTransition = document.getElementById('screen-transition');
const screenResult = document.getElementById('screen-result');
const screenPause = document.getElementById('screen-pause');
const modalRules = document.getElementById('modal-rules');

const hud = document.getElementById('hud');
const touchControls = document.getElementById('touch-controls');

const hudRound = document.getElementById('hud-round');
const hudTimer = document.getElementById('hud-timer');
const hudScorePlayer = document.getElementById('hud-score-player');
const hudScoreAi = document.getElementById('hud-score-ai');
const hudNamePlayer = document.getElementById('hud-name-player');
const hudNameAi = document.getElementById('hud-name-ai');

let selectedTeam = 'FOOTY';

const input = new InputManager();
const game = new GameManager(
  input,
  (pScore, aScore, round, timeLeft) => {
    hudScorePlayer.textContent = pScore;
    hudScoreAi.textContent = aScore;
    hudRound.textContent = `РАУНД ${round} / 3`;
    const sec = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
    hudTimer.textContent = `00:${sec}`;
  },
  (finishedRound, pScore, aScore, proceedNext) => {
    // Round complete transition
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');
    screenTransition.classList.remove('hidden');

    document.getElementById('trans-title').textContent = `РАУНД ${finishedRound} ЗАВЕРШЕН`;
    document.getElementById('trans-sub').textContent = `Счет: ${pScore} -${aScore}`;
    document.getElementById('trans-next').textContent = finishedRound === 1 ? 'СЛЕДУЮЩИЙ: БАСКЕТБОЛ' : 'СЛЕДУЮЩИЙ: FINAL CLASH';

    setTimeout(() => {
      screenTransition.classList.add('hidden');
      hud.classList.remove('hidden');
      touchControls.classList.remove('hidden');
      proceedNext();
    }, 2200);
  },
  (finalPScore, finalAiScore) => {
    // Match End
    hud.classList.add('hidden');
    touchControls.classList.add('hidden');
    screenResult.classList.remove('hidden');

    const status = document.getElementById('result-status');
    if (finalPScore > finalAiScore) {
      status.textContent = 'ПОБЕДА!';
      status.style.color = '#00ff88';
    } else if (finalPScore < finalAiScore) {
      status.textContent = 'ПОРАЖЕНИЕ';
      status.style.color = '#ff3366';
    } else {
      status.textContent = 'НИЧЬЯ';
      status.style.color = '#ffcc00';
    }

    document.getElementById('result-score').textContent = `${selectedTeam}${finalPScore} - ${finalAiScore}${selectedTeam === 'FOOTY' ? 'HOOPS' : 'FOOTY'}`;
  }
);

// UI Event Handlers
document.getElementById('btn-play').onclick = () => {
  screenMenu.classList.add('hidden');
  screenSelect.classList.remove('hidden');
};

document.getElementById('btn-rules').onclick = () => modalRules.classList.remove('hidden');
document.getElementById('btn-close-rules').onclick = () => modalRules.classList.add('hidden');

const chooseTeam = (team) => {
  selectedTeam = team;
  screenSelect.classList.add('hidden');
  screenVs.classList.remove('hidden');

  document.getElementById('vs-player-name').textContent = team;
  document.getElementById('vs-ai-name').textContent = team === 'FOOTY' ? 'HOOPS' : 'FOOTY';
  hudNamePlayer.textContent = team;
  hudNameAi.textContent = team === 'FOOTY' ? 'HOOPS' : 'FOOTY';

  setTimeout(() => {
    screenVs.classList.add('hidden');
    hud.classList.remove('hidden');
    touchControls.classList.remove('hidden');
    game.startMatch(team);
  }, 1600);
};

document.getElementById('btn-choose-footy').onclick = () => chooseTeam('FOOTY');
document.getElementById('btn-choose-hoops').onclick = () => chooseTeam('HOOPS');
// Pause logic
document.getElementById('btn-pause').onclick = () => {
  game.isPaused = true;
  screenPause.classList.remove('hidden');
};

document.getElementById('btn-resume').onclick = () => {
  screenPause.classList.add('hidden');
  game.isPaused = false;
};

document.getElementById('btn-restart').onclick = () => {
  screenPause.classList.add('hidden');
  game.startMatch(selectedTeam);
};

document.getElementById('btn-pause-menu').onclick = () => {
  screenPause.classList.add('hidden');
  hud.classList.add('hidden');
  touchControls.classList.add('hidden');
  screenMenu.classList.remove('hidden');
  game.isMatchRunning = false;
};

// Rematch & Finish Handlers
document.getElementById('btn-rematch').onclick = () => {
  screenResult.classList.add('hidden');
  screenSelect.classList.remove('hidden');
};

document.getElementById('btn-to-menu').onclick = () => {
  screenResult.classList.add('hidden');
  screenMenu.classList.remove('hidden');
};

// Launch Game Render Loop
game.update();