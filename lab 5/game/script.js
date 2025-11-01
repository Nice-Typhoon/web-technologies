let currentLevel = 'primary';
let correctAnswers = 0;
let incorrectAnswers = 0;
let questionCount = 0;
let usedQuestions = new Set();
let timerInterval;
let timeLeft = 300;

const levels = {
    primary: {
        name: 'Начальный',
        operators: ['+', '-', '*', '/'],
        generateQuestion: function() {
            const op = this.operators[Math.floor(Math.random() * this.operators.length)];
            let a, b, answer;

            switch(op) {
                case '+':
                    a = Math.floor(Math.random() * 50) + 1;
                    b = Math.floor(Math.random() * 50) + 1;
                    answer = a + b;
                    break;
                case '-':
                    a = Math.floor(Math.random() * 50) + 1;
                    b = Math.floor(Math.random() * a) + 1;
                    answer = a - b;
                    break;
                case '*':
                    a = Math.floor(Math.random() * 12) + 1;
                    b = Math.floor(Math.random() * 12) + 1;
                    answer = a * b;
                    break;
                case '/':
                    b = Math.floor(Math.random() * 10) + 1;
                    a = b * (Math.floor(Math.random() * 10) + 1);
                    answer = a / b;
                    break;
            }

            return {
                question: `${a} ${op} ${b}`,
                answer: answer,
                type: 'arithmetic'
            };
        }
    },
    intermediate: {
        name: 'Средний',
        operators: ['+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!='],
        generateQuestion: function() {
            const op = this.operators[Math.floor(Math.random() * this.operators.length)];

            if (['>', '<', '>=', '<=', '==', '!='].includes(op)) {
                const a = Math.floor(Math.random() * 50) + 1;
                const b = Math.floor(Math.random() * 50) + 1;

                let answer;
                switch(op) {
                    case '>': answer = a > b; break;
                    case '<': answer = a < b; break;
                    case '>=': answer = a >= b; break;
                    case '<=': answer = a <= b; break;
                    case '==': answer = a == b; break;
                    case '!=': answer = a != b; break;
                }

                return {
                    question: `${a} ${op} ${b}`,
                    answer: answer ? 'true' : 'false',
                    type: 'comparison'
                };
            } else {
                let a, b, answer;
                switch(op) {
                    case '+':
                        a = Math.floor(Math.random() * 100) + 1;
                        b = Math.floor(Math.random() * 100) + 1;
                        answer = a + b;
                        break;
                    case '-':
                        a = Math.floor(Math.random() * 100) + 1;
                        b = Math.floor(Math.random() * a) + 1;
                        answer = a - b;
                        break;
                    case '*':
                        a = Math.floor(Math.random() * 15) + 1;
                        b = Math.floor(Math.random() * 15) + 1;
                        answer = a * b;
                        break;
                    case '/':
                        b = Math.floor(Math.random() * 12) + 1;
                        a = b * (Math.floor(Math.random() * 12) + 1);
                        answer = a / b;
                        break;
                }

                return {
                    question: `${a} ${op} ${b}`,
                    answer: answer,
                    type: 'arithmetic'
                };
            }
        }
    },
    advanced: {
        name: 'Продвинутый',
        operators: ['&&', '||', '!', '^', '&', '|', '<<', '>>', '>>>'],
        generateQuestion: function() {
            const op = this.operators[Math.floor(Math.random() * this.operators.length)];

            if (['&&', '||', '!'].includes(op)) {
                const a = Math.random() > 0.5;
                const b = Math.random() > 0.5;

                let answer;
                switch(op) {
                    case '&&': answer = a && b; break;
                    case '||': answer = a || b; break;
                    case '!':
                        answer = !a;
                        return {
                            question: `!${a}`,
                            answer: answer ? 'true' : 'false',
                            type: 'logical'
                        };
                }

                return {
                    question: `${a} ${op} ${b}`,
                    answer: answer ? 'true' : 'false',
                    type: 'logical'
                };
            } else {
                const a = Math.floor(Math.random() * 16);
                const b = Math.floor(Math.random() * 16);

                let answer;
                switch(op) {
                    case '^': answer = a ^ b; break;
                    case '&': answer = a & b; break;
                    case '|': answer = a | b; break;
                    case '<<': answer = a << (b % 4); break;
                    case '>>': answer = a >> (b % 4); break;
                    case '>>>': answer = (a >>> 0) >> (b % 4); break;
                }

                return {
                    question: `${a} ${op} ${b}`,
                    answer: answer,
                    type: 'bitwise'
                };
            }
        }
    }
};
function generateUniqueQuestion() {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        const questionData = levels[currentLevel].generateQuestion();
        const questionKey = `${questionData.question}_${questionData.type}`;

        if (!usedQuestions.has(questionKey)) {
            usedQuestions.add(questionKey);
            return questionData;
        }

        attempts++;
    }

    return levels[currentLevel].generateQuestion();
}
function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timeLeft').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 0) {
        endGame('Время вышло!');
        return;
    }

    timeLeft--;
}
function startGame() {
    correctAnswers = 0;
    incorrectAnswers = 0;
    questionCount = 0;
    usedQuestions.clear();
    timeLeft = 300;
    currentLevel = 'primary';

    document.getElementById('levelDisplay').textContent = levels[currentLevel].name;
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('incorrectCount').textContent = '0';
    document.getElementById('status').textContent = '';
    document.getElementById('congratulations').classList.add('hidden');
    document.getElementById('question').textContent = 'Первый вопрос уже ждёт вас!';

    document.querySelector('.input-container').classList.remove('hidden');
    document.getElementById('submitBtn').classList.remove('hidden');
    document.getElementById('startBtn').classList.add('hidden');

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    const input = document.getElementById('answerInput');
    input.value = '';
    input.disabled = false;
    input.focus();

    document.getElementById('submitBtn').disabled = false;

    showNextQuestion();
}
function showNextQuestion() {
    if (questionCount >= 10) {
        const successRate = (correctAnswers / 10) * 100;

        if (successRate >= 80 && currentLevel !== 'advanced') {
            let nextLevel;
            if (currentLevel === 'primary') {
                nextLevel = 'intermediate';
            } else if (currentLevel === 'intermediate') {
                nextLevel = 'advanced';
            }

            document.getElementById('status').innerHTML =
                `<span class="correct">Поздравляем! Вы прошли уровень ${levels[currentLevel].name}!<br>Переходите на уровень ${levels[nextLevel].name}.</span>`;

            setTimeout(() => {
                currentLevel = nextLevel;
                document.getElementById('levelDisplay').textContent = levels[currentLevel].name;
                questionCount = 0;
                usedQuestions.clear();
                document.getElementById('correctCount').textContent = '0';
                document.getElementById('incorrectCount').textContent = '0';
                document.getElementById('status').textContent = '';
                showNextQuestion();
            }, 2000);
        } else {
            endGame(`Вы завершили уровень ${levels[currentLevel].name}.<br>Правильных ответов: ${correctAnswers}/10`);
        }
        return;
    }

    const questionData = generateUniqueQuestion();
    document.getElementById('question').textContent = questionData.question;
    document.getElementById('answerInput').value = '';
    document.getElementById('answerInput').focus();
    document.getElementById('status').textContent = '';
}
function checkAnswer() {
    const userAnswer = document.getElementById('answerInput').value.trim();
    const currentQuestion = document.getElementById('question').textContent;

    if (userAnswer.toLowerCase() === 'next') {
        correctAnswers = 10;
        document.getElementById('correctCount').textContent = correctAnswers;
        document.getElementById('status').innerHTML = '<span class="correct">Тест-режим: +10 правильных ответов!</span>';
        questionCount = 10;
        setTimeout(showNextQuestion, 1000);
        return;
    }

    const normalizedInput = userAnswer.toLowerCase();

    if (!normalizedInput) {
        document.getElementById('status').innerHTML = '<span class="incorrect">Пожалуйста, введите ответ!</span>';
        return;
    }

    let correctAnswer = getCorrectAnswerForCurrentQuestion(currentQuestion);

    if (!correctAnswer) {
        document.getElementById('status').innerHTML = '<span class="incorrect">Ошибка генерации вопроса.</span>';
        setTimeout(showNextQuestion, 1000);
        return;
    }

    let normalizedUserAnswer = normalizedInput;
    if (['true', 'false'].includes(normalizedInput)) {
        normalizedUserAnswer = normalizedInput;
    } else if (normalizedInput === '1' || normalizedInput === '0') {
        normalizedUserAnswer = normalizedInput === '1' ? 'true' : 'false';
    } else if (normalizedInput === 'yes' || normalizedInput === 'no') {
        normalizedUserAnswer = normalizedInput === 'yes' ? 'true' : 'false';
    }

    if (normalizedUserAnswer === correctAnswer) {
        correctAnswers++;
        document.getElementById('correctCount').textContent = correctAnswers;
        document.getElementById('status').innerHTML = '<span class="correct">Правильно!</span>';
    } else {
        incorrectAnswers++;
        document.getElementById('incorrectCount').textContent = incorrectAnswers;
        document.getElementById('status').innerHTML = `<span class="incorrect">Неправильно! Правильный ответ: ${correctAnswer}</span>`;
    }

    questionCount++;
    setTimeout(showNextQuestion, 1000);
}

function getCorrectAnswerForCurrentQuestion(questionText) {
    const parts = questionText.split(' ');
    if (parts.length < 3) return '';

    const aStr = parts[0];
    const op = parts[1];
    const bStr = parts[2];

    const isBoolA = aStr === 'true' || aStr === 'false';
    const isBoolB = bStr === 'true' || bStr === 'false';

    let a, b;
    if (isBoolA) {
        a = aStr === 'true';
    } else {
        a = parseFloat(aStr);
    }
    if (isBoolB) {
        b = bStr === 'true';
    } else {
        b = parseFloat(bStr);
    }

    let result;

    switch(op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': result = a / b; break;
        case '>': result = a > b; break;
        case '<': result = a < b; break;
        case '>=': result = a >= b; break;
        case '<=': result = a <= b; break;
        case '==': result = a == b; break;
        case '!=': result = a != b; break;
        case '&&': result = a && b; break;
        case '||': result = a || b; break;
        case '!': result = !a; break;
        case '^': result = a ^ b; break;
        case '&': result = a & b; break;
        case '|': result = a | b; break;
        case '<<': result = a << (b % 4); break;
        case '>>': result = a >> (b % 4); break;
        case '>>>': result = (a >>> 0) >> (b % 4); break;
        default: return '';
    }

    if (typeof result === 'boolean') {
        return result ? 'true' : 'false';
    } else if (Number.isInteger(result)) {
        return result.toString();
    } else {
        return result.toFixed(2).replace(/\.0+$/, '');
    }
}
function endGame(message) {
    clearInterval(timerInterval);
    document.getElementById('question').classList.add('hidden');
    document.getElementById('status').classList.add('hidden');
    document.getElementById('answerInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('status').innerHTML = `<span class="correct">${message}</span>`;
    document.getElementById('congratsMessage').innerHTML = message;
    document.getElementById('congratulations').classList.remove('hidden');
    document.getElementById('startBtn').classList.remove('hidden');
    document.querySelector('.input-container').classList.add('hidden');
    document.getElementById('submitBtn').classList.add('hidden');
}
function restartGame() {
    clearInterval(timerInterval);

    document.getElementById('startBtn').classList.remove('hidden');
    document.querySelector('.input-container').classList.add('hidden');
    document.getElementById('submitBtn').classList.add('hidden');
    document.getElementById('congratulations').classList.add('hidden');
    document.getElementById('question').textContent = 'Нажмите "Начать игру", чтобы начать!';
    document.getElementById('status').textContent = '';
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('incorrectCount').textContent = '0';
    document.getElementById('levelDisplay').textContent = 'Начальный';
    document.getElementById('timeLeft').textContent = '5:00';
}
function quitGame() {
    if (confirm('Вы действительно хотите выйти из игры?')) {
        clearInterval(timerInterval);
        document.getElementById('gameContainer').innerHTML = `
            <h1>Спасибо за игру!</h1>
            <p>До новых встреч!</p>
            <button onclick="location.reload()" style="width:200px;margin:20px auto;display:block;">Начать заново</button>
        `;
    }
}
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('question').textContent = 'Нажмите "Начать игру", чтобы начать!';
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('submitBtn').addEventListener('click', checkAnswer);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('quitBtn').addEventListener('click', quitGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
    document.getElementById('answerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
});