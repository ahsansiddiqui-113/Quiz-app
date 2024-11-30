const authPage = document.getElementById("auth-page");
const startPage = document.getElementById("start-page");
const quizPage = document.getElementById("quiz-page");
const resultsPage = document.getElementById("results-page");

const authForm = document.getElementById("auth-form");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const exitBtn = document.getElementById("exit-btn");

const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const resultsSummary = document.getElementById("results-summary");

let token = null;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// Event Listeners
authForm.addEventListener("submit", handleLogin);
signupBtn.addEventListener("click", handleSignup);
startBtn.addEventListener("click", fetchQuestions);
nextBtn.addEventListener("click", handleNextButton);
exitBtn.addEventListener("click", () => location.reload());

async function handleSignup() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message); // Basic alert for now
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (data.success) {
    token = data.token;
    showSweetAlert("success", "Login successful!", "Proceed to the quiz.");
    authPage.style.display = "none";
    startPage.style.display = "block";
  } else {
    showSweetAlert("error", "Login failed", data.message);
  }
}

async function fetchQuestions() {
  const response = await fetch("http://localhost:5000/questions", {
    headers: { Authorization: `Bearer ${token}` },
  });

  questions = await response.json();
  startPage.style.display = "none";
  quizPage.style.display = "block";
  startQuiz();
}

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  nextBtn.innerHTML = "Next";
  showQuestion();
}

function showQuestion() {
  resetState();
  const currentQuestion = questions[currentQuestionIndex];
  questionElement.innerHTML = currentQuestion.question;

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.innerHTML = answer.text;
    button.classList.add("btn");
    answerButtons.appendChild(button);

    if (answer.correct) {
      button.dataset.correct = answer.correct;
    }

    button.addEventListener("click", selectAnswer);
  });
}

function resetState() {
  nextBtn.style.display = "none";
  answerButtons.innerHTML = "";
}

function selectAnswer(e) {
  const selectedBtn = e.target;
  const isCorrect = selectedBtn.dataset.correct === "true";

  if (isCorrect) {
    selectedBtn.classList.add("correct");
    score++;
    showSweetAlert("success", "Good Job!", "Correct Answer");
  } else {
    selectedBtn.classList.add("incorrect");
    showSweetAlert("error", "Oops!", "Incorrect Answer");
  }

  Array.from(answerButtons.children).forEach((button) => {
    if (button.dataset.correct === "true") button.classList.add("correct");
    button.disabled = true;
  });

  nextBtn.style.display = "block";
}

function handleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

async function showResults() {
  resetState();
  quizPage.style.display = "none";
  resultsPage.style.display = "block";

  await fetch("http://localhost:5000/results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ score, total: questions.length }),
  });

  resultsSummary.innerHTML = `You scored ${score} out of ${questions.length}!`;
}

// SweetAlert UI Alerts
function showSweetAlert(type, title, text) {
  Swal.fire({
    icon: type,
    title: title,
    text: text,
    showConfirmButton: false,
    timer: 1500,
  });
}
