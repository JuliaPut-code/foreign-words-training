// DOM Elements
const flipCard = document.querySelector('.flip-card');
const flipCardInner = document.querySelector('.flip-card-inner');
const cardFront = document.querySelector('#card-front h1');
const cardBack = document.querySelector('#card-back h1');
const cardExample = document.querySelector('#card-back span');
const backButton = document.querySelector('#back');
const nextButton = document.querySelector('#next');
const shuffleButton = document.querySelector('#shuffle-words');
const examButton = document.querySelector('#exam');
const studyMode = document.querySelector('#study-mode');
const examMode = document.querySelector('#exam-mode');
const progressBar = document.querySelector('#words-progress');
const examProgressBar = document.querySelector('#exam-progress');
const currentWordElement = document.querySelector('#current-word');
const totalWordElement = document.querySelector('#total-word');
const examCardsContainer = document.querySelector('#exam-cards');
const resultsModal = document.querySelector('.results-modal');
const resultsContent = document.querySelector('.results-content');
const timerElement = document.querySelector('#time');
const resultsTime = document.querySelector('#timer');
const correctPercentElement = document.querySelector('#correct-percent');
const studyCards = document.querySelector('.study-cards');
const resultsTemplate = document.querySelector('#word-stats');

// Data
let words = [
    { word: 'Hello', translation: 'Привет', example: 'Hello, how are you?' },
    { word: 'World', translation: 'Мир', example: 'The world is beautiful.' },
    { word: 'Learn', translation: 'Учить', example: 'I love to learn new things.' },
    { word: 'Code', translation: 'Код', example: 'Write clean code.' },
    { word: 'JavaScript', translation: 'ДжаваСкрипт', example: 'JavaScript is awesome.' }
];
let currentIndex = 0;
let isExamMode = false;
let startTime = null;
let correctAnswers = 0;
let incorrectAnswers = 0;
let matchedPairs = 0;

// Timer Functionality
let seconds = 0;
let timer;

function startTimer() {
    timer = setInterval(() => {
        seconds++;
        const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        timerElement.textContent = `${minutes}:${secs}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

// Utility Functions
const saveProgress = () => {
    const progress = {
        currentIndex,
        words,
        correctAnswers,
        incorrectAnswers,
        matchedPairs,
        startTime: isExamMode ? startTime : null,
    };
    localStorage.setItem('wordAppProgress', JSON.stringify(progress));
};

const loadProgress = () => {
    const progress = JSON.parse(localStorage.getItem('wordAppProgress'));
    if (progress) {
        currentIndex = progress.currentIndex || 0;
        words = progress.words || words;
        correctAnswers = progress.correctAnswers || 0;
        incorrectAnswers = progress.incorrectAnswers || 0;
        matchedPairs = progress.matchedPairs || 0;
        startTime = progress.startTime || null;
    }
};

const updateStudyUI = () => {
    cardFront.textContent = words[currentIndex].word;
    cardBack.textContent = words[currentIndex].translation;
    cardExample.textContent = words[currentIndex].example;
    currentWordElement.textContent = currentIndex + 1;
    totalWordElement.textContent = words.length;
    progressBar.value = ((currentIndex + 1) / words.length) * 100;
    backButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === words.length - 1;
};

const updateExamProgress = () => {
    const percentCorrect = (correctAnswers / words.length) * 100;
    correctPercentElement.textContent = `${percentCorrect}%`;
    examProgressBar.value = percentCorrect;
};

// Event Listeners
flipCard.addEventListener('click', () => {
    flipCard.classList.toggle('active');
});

backButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateStudyUI();
        saveProgress();
    }
});

nextButton.addEventListener('click', () => {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        updateStudyUI();
        saveProgress();
    }
});

shuffleButton.addEventListener('click', () => {
    words = words.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    updateStudyUI();
    saveProgress();
});

examButton.addEventListener('click', () => {
    isExamMode = true;
    studyMode.classList.add('hidden');
    examMode.classList.remove('hidden');
    studyCards.classList.add('hidden');
    renderExamCards();
    startTime = new Date();
    startTimer();
    saveProgress();
});

// Exam Mode Logic
const renderExamCards = () => {
    examCardsContainer.innerHTML = '';

    const pairedWords = words.map(item => ({
        word: item.word,
        translation: item.translation,
    }));

    const shuffledPairs = pairedWords.sort(() => Math.random() - 0.5);

    const splitCards = shuffledPairs.flatMap(pair => [
        { text: pair.word, pairId: pair.word },
        { text: pair.translation, pairId: pair.word },
    ]);

    const shuffledCards = splitCards.sort(() => Math.random() - 0.5);

    shuffledCards.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = item.text;
        card.dataset.pairId = item.pairId;
        card.addEventListener('click', () => handleExamCardClick(card));
        examCardsContainer.append(card);
    });
};

let attemptTracker = {};
words.forEach((item) => {
    attemptTracker[item.word] = 0;
});

let selectedCards = [];

const handleExamCardClick = (card) => {
    if (selectedCards.length < 2 && !card.classList.contains('fade-out')) {
        selectedCards.push(card);
        card.classList.add('correct');
        if (selectedCards.length === 2) {
            const [first, second] = selectedCards;
            if (first.dataset.pairId === second.dataset.pairId) {
                setTimeout(() => {
                    first.classList.add('fade-out');
                    second.classList.add('fade-out');
                    matchedPairs++;
                    correctAnswers++;
                    updateExamProgress();
                    checkExamCompletion();
                }, 500);
            } else {
                attemptTracker[first.dataset.pairId]++;
                incorrectAnswers++;
                second.classList.add('wrong');
                setTimeout(() => {
                    second.classList.remove('wrong', 'correct');
                    first.classList.remove('correct');
                }, 500);
            }
            selectedCards = [];
            saveProgress();
        }
    }
};

const checkExamCompletion = () => {
    if (matchedPairs === words.length) {
        showResults();
        saveProgress();
    }
};

// Show Results
const showResults = () => {
    stopTimer();
    resultsModal.classList.remove('hidden');
    const duration = Math.floor((new Date() - startTime) / 1000);
    const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
    const seconds = (duration % 60).toString().padStart(2, '0');
    resultsTime.textContent = `${minutes}:${seconds}`;
    resultsContent.innerHTML = "";

    words.forEach((word) => {
        const attempts = attemptTracker[word.word] + 1;
        const template = resultsTemplate.content.cloneNode(true);
        template.querySelector('.word span').textContent = word.word;
        template.querySelector('.attempts span').textContent = attempts;
        resultsContent.append(template);
    });;
};

// Initialize Application
loadProgress();
updateStudyUI();