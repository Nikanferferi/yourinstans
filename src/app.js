import {
  initFirebase,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  signInWithEmail,
  watchAuthState,
} from './firebase.js';
import { tracks } from './lessonData.js';

const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard');
const practiceArea = document.getElementById('practice-area');
const practiceDescription = document.getElementById('practice-description');
const trackList = document.getElementById('track-list');
const googleSignInButton = document.getElementById('google-sign-in');
const emailAuthForm = document.getElementById('email-auth-form');
const signUpButton = document.getElementById('sign-up');
const signOutButton = document.getElementById('sign-out');
const userNameLabel = document.getElementById('user-name');
const streakCountLabel = document.getElementById('streak-count');
const authFeedback = document.getElementById('auth-feedback');

initFirebase();

const STREAK_KEY = 'triolingo-streak';
const PROGRESS_KEY_BASE = 'triolingo-progress';

let progressStorageKey = PROGRESS_KEY_BASE;
let progress = {};
let currentTrack = null;
let currentStepIndex = 0;
let nextButton = null;
let nextButtonAction = null;
let feedbackContainer = null;

const streakState = loadStreak();
updateStreakLabel();
resetPracticeArea();
renderTrackList();

function loadStreak() {
  try {
    const saved = JSON.parse(localStorage.getItem(STREAK_KEY));
    return (
      saved || {
        count: 0,
        lastActive: null,
      }
    );
  } catch (error) {
    console.warn('Kunde inte läsa streak från localStorage', error);
    return { count: 0, lastActive: null };
  }
}

function saveStreak() {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streakState));
}

function touchStreak() {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (streakState.lastActive === todayKey) {
    return;
  }

  if (streakState.lastActive) {
    const lastDate = new Date(`${streakState.lastActive}T00:00:00`);
    const todayDate = new Date(`${todayKey}T00:00:00`);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    streakState.count = diffDays === 1 ? streakState.count + 1 : 1;
  } else {
    streakState.count = 1;
  }

  streakState.lastActive = todayKey;
  saveStreak();
  updateStreakLabel();
}

function updateStreakLabel() {
  streakCountLabel.textContent = streakState.count;
}

function resetPracticeArea() {
  practiceDescription.textContent =
    'Välj ett spår för att komma igång med en fokuserad mikrolektion.';
  practiceArea.innerHTML =
    '<p class="text-muted">När du väljer ett spår dyker uppgifterna upp här.</p>';
}

function showAuthFeedback(message = '', isError = true) {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.style.color = isError ? '#e53e3e' : 'var(--accent)';
}

function setActiveUser(user) {
  progressStorageKey = user
    ? `${PROGRESS_KEY_BASE}:${user.uid}`
    : PROGRESS_KEY_BASE;
  progress = loadProgress();
  renderTrackList();
  resetPracticeArea();
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(progressStorageKey));
    return saved || {};
  } catch (error) {
    console.warn('Kunde inte läsa progression från localStorage', error);
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(progressStorageKey, JSON.stringify(progress));
}

function markTrackProgress(trackId, completedLessons) {
  progress[trackId] = Math.min(
    completedLessons,
    tracks.find((track) => track.id === trackId)?.microLessons.length || completedLessons
  );
  saveProgress();
  renderTrackList();
}

function renderTrackList() {
  trackList.innerHTML = '';

  tracks.forEach((track) => {
    const completed = progress[track.id] || 0;
    const total = track.microLessons.length;
    const card = document.createElement('article');
    card.className = 'track-card';

    const title = document.createElement('h3');
    title.textContent = `${track.emoji} ${track.title}`;
    card.append(title);

    const description = document.createElement('p');
    description.textContent = track.description;
    card.append(description);

    const meta = document.createElement('div');
    meta.className = 'track-card__meta';

    const xp = document.createElement('span');
    xp.className = 'track-card__xp';
    xp.textContent = `⭐ ${track.xp} XP`;
    meta.append(xp);

    const progressLabel = document.createElement('span');
    progressLabel.textContent = `🎯 ${completed}/${total} lektioner`;
    meta.append(progressLabel);

    card.append(meta);

    const button = document.createElement('button');
    button.className = 'button button--ghost';
    button.type = 'button';

    const isCompleted = completed >= total;
    button.textContent = isCompleted ? 'Repetera spåret' : 'Fortsätt';

    button.addEventListener('click', () => {
      startTrack(track);
    });

    card.append(button);
    trackList.append(card);
  });
}

function startTrack(track) {
  currentTrack = track;
  const completed = progress[track.id] || 0;
  currentStepIndex = completed >= track.microLessons.length ? 0 : completed;

  practiceDescription.textContent = `${track.title}: ${track.description}`;
  renderCurrentLesson();
}

function renderCurrentLesson() {
  practiceArea.innerHTML = '';
  feedbackContainer = null;
  nextButton = null;
  nextButtonAction = null;

  if (!currentTrack) {
    resetPracticeArea();
    return;
  }

  const lesson = currentTrack.microLessons[currentStepIndex];

  if (!lesson) {
    renderTrackCompletion();
    return;
  }

  const { questionContainer, feedbackEl, footer, nextBtn } = createPracticeScaffold();
  feedbackContainer = feedbackEl;
  nextButton = nextBtn;

  if (lesson.type === 'multipleChoice') {
    renderMultipleChoiceLesson(questionContainer, lesson);
  } else if (lesson.type === 'flashcard') {
    renderFlashcardLesson(questionContainer, lesson);
  } else if (lesson.type === 'translate') {
    renderTranslateLesson(questionContainer, lesson);
  } else if (lesson.type === 'ordering') {
    renderOrderingLesson(questionContainer, lesson);
  }

  footer.append(nextButton);
}

function createPracticeScaffold() {
  const questionContainer = document.createElement('div');
  questionContainer.className = 'practice__question';

  const feedbackEl = document.createElement('div');
  feedbackEl.className = 'practice__feedback';

  const footer = document.createElement('div');
  footer.className = 'practice__footer';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'button';
  nextBtn.style.display = 'none';
  nextBtn.addEventListener('click', () => {
    if (typeof nextButtonAction === 'function') {
      nextButtonAction();
    }
  });

  practiceArea.append(questionContainer, feedbackEl, footer);

  return { questionContainer, feedbackEl, footer, nextBtn };
}

function handleNextStep() {
  if (!currentTrack) {
    resetPracticeArea();
    return;
  }

  const lessonCount = currentTrack.microLessons.length;

  if (currentStepIndex + 1 < lessonCount) {
    currentStepIndex += 1;
    renderCurrentLesson();
  } else {
    renderTrackCompletion();
  }
}

function renderTrackCompletion() {
  const container = document.createElement('div');
  container.className = 'practice__question';

  const heading = document.createElement('h3');
  heading.textContent = 'Strålande arbete!';
  container.append(heading);

  const body = document.createElement('p');
  body.textContent =
    'Du har klarat alla mikrolektioner i detta spår. Repetera gärna för att stärka minnet eller hoppa till ett nytt spår.';
  container.append(body);

  practiceDescription.textContent = `${currentTrack?.title || 'Spåret'} är klart!`;

  const buttonRow = document.createElement('div');
  buttonRow.className = 'practice__footer';

  const repeatButton = document.createElement('button');
  repeatButton.className = 'button button--ghost';
  repeatButton.type = 'button';
  repeatButton.textContent = 'Repetera spåret';
  repeatButton.addEventListener('click', () => {
    currentStepIndex = 0;
    renderCurrentLesson();
  });

  const homeButton = document.createElement('button');
  homeButton.className = 'button';
  homeButton.type = 'button';
  homeButton.textContent = 'Tillbaka till spår';
  homeButton.addEventListener('click', () => {
    currentTrack = null;
    resetPracticeArea();
  });

  buttonRow.append(repeatButton, homeButton);
  practiceArea.innerHTML = '';
  practiceArea.append(container, buttonRow);
}

function renderMultipleChoiceLesson(container, lesson) {
  const prompt = document.createElement('p');
  prompt.textContent = lesson.prompt;
  container.append(prompt);

  if (lesson.media) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = lesson.media;
    audio.style.marginTop = '0.5rem';
    container.append(audio);
  }

  if (lesson.multiAnswer) {
    const helper = document.createElement('p');
    helper.className = 'text-muted';
    helper.textContent = 'Välj alla svar som stämmer och bekräfta.';
    container.append(helper);
  }

  const list = document.createElement('ul');
  list.className = 'option-list';

  const buttons = [];
  const selected = new Set();
  const correctLabels = lesson.options
    .filter((option) => option.correct)
    .map((option) => option.label);

  lesson.options.forEach((option) => {
    const listItem = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.label;
    if (option.correct) {
      button.dataset.correct = 'true';
    }

    if (lesson.multiAnswer) {
      button.addEventListener('click', () => {
        if (selected.has(option.label)) {
          selected.delete(option.label);
          button.classList.remove('selected');
        } else {
          selected.add(option.label);
          button.classList.add('selected');
        }
        updateMultiSubmitState();
      });
    } else {
      button.addEventListener('click', () => {
        handleSingleChoiceSelection(button, option, buttons, lesson);
      });
    }

    listItem.append(button);
    list.append(listItem);
    buttons.push(button);
  });

  container.append(list);

  if (lesson.multiAnswer) {
    const submit = document.createElement('button');
    submit.className = 'button';
    submit.textContent = 'Bekräfta svar';
    submit.disabled = true;
    submit.addEventListener('click', () => {
      const selectedLabels = Array.from(selected.values());
      const allCorrect =
        selectedLabels.length === correctLabels.length &&
        selectedLabels.every((label) => correctLabels.includes(label));

      buttons.forEach((button) => {
        button.disabled = true;
        const isCorrect = button.dataset.correct === 'true';
        if (isCorrect && selected.has(button.textContent)) {
          button.classList.add('correct');
        } else if (isCorrect) {
          button.classList.add('correct');
        } else if (selected.has(button.textContent)) {
          button.classList.add('incorrect');
        }
      });

      if (allCorrect) {
        const explanation = lesson.options
          .filter((option) => option.correct && option.explanation)
          .map((option) => option.explanation)
          .join(' ');
        showFeedback(lesson.success || 'Rätt!', false, explanation);
        submit.disabled = true;
        completeLessonStep();
      } else {
        showFeedback(
          'Några val var inte helt rätt – försök igen genom att starta om uppgiften.',
          true
        );
        nextButton.textContent = 'Försök igen';
        nextButton.style.display = 'inline-flex';
        nextButtonAction = () => {
          renderCurrentLesson();
        };
      }
    });
    container.append(submit);

    function updateMultiSubmitState() {
      submit.disabled = selected.size === 0;
    }
  }
}

function handleSingleChoiceSelection(button, option, buttons, lesson) {
  if (button.classList.contains('correct')) {
    return;
  }

  const isCorrect = Boolean(option.correct);

  if (isCorrect) {
    button.classList.add('correct');
    buttons.forEach((btn) => {
      btn.disabled = true;
    });
    showFeedback(lesson.success || 'Snyggt jobbat!', false, option.explanation);
    completeLessonStep();
  } else {
    button.classList.add('incorrect');
    button.disabled = true;
    showFeedback('Inte riktigt. Försök igen!', true, option.explanation);
  }
}

function renderFlashcardLesson(container, lesson) {
  const card = document.createElement('div');
  card.className = 'flashcard';

  const prompt = document.createElement('p');
  prompt.textContent = lesson.prompt;
  card.append(prompt);

  const revealButton = document.createElement('button');
  revealButton.className = 'button button--ghost';
  revealButton.type = 'button';
  revealButton.textContent = 'Visa svaret';

  const answer = document.createElement('p');
  answer.className = 'flashcard__answer';
  answer.textContent = lesson.answer;

  revealButton.addEventListener('click', () => {
    answer.classList.add('is-visible');
    revealButton.disabled = true;
    showFeedback(
      lesson.success || 'Fundera på hur du skulle förklara detta för en vän.',
      false,
      lesson.explanation
    );
    completeLessonStep();
  });

  card.append(revealButton, answer);
  container.append(card);
}

function renderTranslateLesson(container, lesson) {
  const prompt = document.createElement('p');
  prompt.textContent = lesson.prompt;
  container.append(prompt);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'translate-input';
  input.placeholder = 'Skriv din översättning här';
  container.append(input);

  const submit = document.createElement('button');
  submit.className = 'button';
  submit.type = 'button';
  submit.textContent = 'Kontrollera';
  submit.addEventListener('click', () => {
    const normalizedInput = normalizeText(input.value);
    const normalizedAnswer = normalizeText(lesson.answer);

    if (!normalizedInput) {
      showFeedback('Skriv ett svar för att kontrollera.', true);
      return;
    }

    if (normalizedInput === normalizedAnswer) {
      showFeedback(lesson.success || 'Perfekt översättning!', false, lesson.explanation);
      completeLessonStep();
      input.disabled = true;
      submit.disabled = true;
    } else {
      showFeedback('Inte helt rätt. Försök igen!', true, lesson.explanation);
    }
  });

  container.append(submit);
}

function renderOrderingLesson(container, lesson) {
  const prompt = document.createElement('p');
  prompt.textContent = lesson.prompt;
  container.append(prompt);

  const ordering = document.createElement('div');
  ordering.className = 'ordering';

  const pool = document.createElement('div');
  pool.className = 'ordering__pool';

  const answerArea = document.createElement('div');
  answerArea.className = 'ordering__answer';

  const selected = [];

  lesson.options.forEach((label) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = label;

    chip.addEventListener('click', () => {
      selected.push(label);
      chip.classList.add('is-disabled');
      updateAnswerArea();
    });

    pool.append(chip);
  });

  const submit = document.createElement('button');
  submit.className = 'button';
  submit.type = 'button';
  submit.textContent = 'Bekräfta ordning';
  submit.disabled = true;
  submit.addEventListener('click', () => {
    const isCorrect = lesson.answer.every((value, index) => value === selected[index]);
    if (isCorrect) {
      showFeedback(lesson.success || 'Superbt sorterat!', false);
      completeLessonStep();
      submit.disabled = true;
      Array.from(pool.children).forEach((chip) => {
        chip.disabled = true;
      });
      Array.from(answerArea.children).forEach((chip) => {
        chip.disabled = true;
      });
    } else {
      showFeedback('Dubbelkolla ordningen och försök igen.', true);
    }
  });

  function updateAnswerArea() {
    answerArea.innerHTML = '';

    selected.forEach((value, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip chip--ghost';
      chip.textContent = `${index + 1}. ${value}`;
      chip.addEventListener('click', () => {
        selected.splice(index, 1);
        const poolButton = Array.from(pool.children).find(
          (child) => child.textContent === value
        );
        if (poolButton) {
          poolButton.classList.remove('is-disabled');
        }
        updateAnswerArea();
      });
      answerArea.append(chip);
    });

    submit.disabled = selected.length !== lesson.answer.length;
  }

  ordering.append(pool, answerArea);
  container.append(ordering, submit);
}

function showFeedback(message, isError = false, explanation = '') {
  if (!feedbackContainer) return;
  feedbackContainer.innerHTML = '';

  const feedback = document.createElement('div');
  feedback.className = `feedback${isError ? ' feedback--error' : ''}`;
  feedback.textContent = message;

  if (explanation) {
    const explanationEl = document.createElement('p');
    explanationEl.style.marginTop = '0.5rem';
    explanationEl.textContent = explanation;
    feedback.append(explanationEl);
  }

  feedbackContainer.append(feedback);
}

function completeLessonStep() {
  if (!currentTrack) return;

  const completedLessons = Math.max(currentStepIndex + 1, progress[currentTrack.id] || 0);
  markTrackProgress(currentTrack.id, completedLessons);
  touchStreak();

  if (!nextButton) return;

  const hasNext = currentStepIndex + 1 < currentTrack.microLessons.length;
  nextButton.textContent = hasNext ? 'Nästa uppgift' : 'Spåret klart';
  nextButton.style.display = 'inline-flex';
  nextButton.disabled = false;
  nextButtonAction = hasNext ? handleNextStep : renderTrackCompletion;
}

function normalizeText(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

watchAuthState((user) => {
  if (user) {
    authSection.classList.add('card--hidden');
    dashboardSection.classList.remove('card--hidden');
    userNameLabel.textContent = user.displayName || user.email || 'Elev';
    touchStreak();
    setActiveUser(user);
    showAuthFeedback('');
  } else {
    authSection.classList.remove('card--hidden');
    dashboardSection.classList.add('card--hidden');
    userNameLabel.textContent = 'Elev';
    setActiveUser(null);
    showAuthFeedback('');
  }
});

googleSignInButton.addEventListener('click', async () => {
  googleSignInButton.disabled = true;
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error('Google-inloggning misslyckades', error);
    showAuthFeedback('Google-inloggningen misslyckades. Försök igen.');
  } finally {
    googleSignInButton.disabled = false;
  }
});

signUpButton.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    showAuthFeedback('Fyll i e-post och lösenord för att skapa ett konto.');
    return;
  }

  signUpButton.disabled = true;
  try {
    await signUpWithEmail(email, password);
  } catch (error) {
    console.error('Kunde inte skapa konto', error);
    showAuthFeedback('Kunde inte skapa konto: ' + (error.message || 'okänt fel'));
  } finally {
    signUpButton.disabled = false;
  }
});

emailAuthForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (!email || !password) {
    showAuthFeedback('Fyll i både e-post och lösenord.');
    return;
  }

  emailAuthForm.querySelector('button[type="submit"]').disabled = true;

  try {
    await signInWithEmail(email, password);
  } catch (error) {
    console.error('Inloggningen misslyckades', error);
    showAuthFeedback('Fel inloggningsuppgifter. Kontrollera och försök igen.');
  } finally {
    emailAuthForm.querySelector('button[type="submit"]').disabled = false;
  }
});

signOutButton.addEventListener('click', async () => {
  try {
    await signOutUser();
  } catch (error) {
    console.error('Kunde inte logga ut', error);
    showAuthFeedback('Utloggningen misslyckades. Försök igen.');
  }
});
