let currentQuestions = [];
let currentIndex = 0;
let score = 0;

let selectedDepartment = "";
let selectedSubject = "";
let selectedMode = "";

let userAnswers = [];
let answeredQuestions = [];

let examSubmitted = false;

const SAVE_KEY = "nursingQuizProgress_v2";

const departments = {
    pediatric: {
        title: "Pediatric Department",
        subjects: [
            { key: "pediatricNursing", name: "Pediatric Nursing" },
            { key: "pediatricMedicine", name: "Pediatric Medicine" },
            { key: "pediatricSurgery", name: "Pediatric Surgery" },
            { key: "evidenceBasedPractice", name: "Evidence-Based Practice" },
            { key: "pediatricSpecialNeeds", name: "Pediatric with Special Needs" },
            { key: "stressAndCoping", name: "Stress and Coping" },
            { key: "sportsCulture", name: "Sports Culture" }
        ]
    }
};

function saveProgress(screen = "quiz") {
    const progress = {
        department: selectedDepartment,
        subject: selectedSubject,
        mode: selectedMode,
        index: currentIndex,
        score: score,
        userAnswers: userAnswers,
        answeredQuestions: answeredQuestions,
        screen: screen,
        examSubmitted: examSubmitted
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error("Could not save quiz progress:", error);
    }
}

function clearProgress() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (error) {
        console.error("Could not clear quiz progress:", error);
    }
}

function hideAllScreens() {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.add("hidden");
    });
}

function showDepartments() {
    hideAllScreens();
    document.getElementById("department-screen").classList.remove("hidden");
}

function showSubjects(departmentKey) {
    selectedDepartment = departmentKey;

    hideAllScreens();

    const department = departments[departmentKey];

    document.getElementById("department-title").textContent = department.title;

    const container = document.getElementById("subjects-container");
    container.innerHTML = "";

    department.subjects.forEach(subject => {
        const button = document.createElement("button");
        button.textContent = subject.name;
        button.onclick = () => selectSubject(subject.key, subject.name);
        container.appendChild(button);
    });

    document.getElementById("subject-screen").classList.remove("hidden");
}

function selectSubject(subjectKey, subjectName) {
    selectedSubject = subjectKey;

    document.getElementById("subject-selected-title").textContent = subjectName;

    hideAllScreens();
    document.getElementById("mode-screen").classList.remove("hidden");
}

function buildQuestionList() {
    let subjectBank = questionBank[selectedSubject];

    if (!subjectBank && questionBank.mcq && questionBank.tf) {
        subjectBank = questionBank;
    }

    if (!subjectBank) return [];

    const mcqQuestions = subjectBank.mcq || [];
    const tfQuestions = subjectBank.tf || [];

    if (selectedMode === "mcq") return [...mcqQuestions];
    if (selectedMode === "tf") return [...tfQuestions];

    return [...mcqQuestions, ...tfQuestions];
}

function startQuiz(mode) {
    selectedMode = mode;
    currentQuestions = buildQuestionList();

    if (currentQuestions.length === 0) {
        alert("No questions available for this quiz yet.");
        return;
    }

    currentIndex = 0;
    score = 0;

    userAnswers = new Array(currentQuestions.length).fill(null);
    answeredQuestions = new Array(currentQuestions.length).fill(false);

    examSubmitted = false;

    saveProgress("quiz");

    hideAllScreens();
    document.getElementById("quiz-screen").classList.remove("hidden");

    showQuestion();
}

function updateNavigation() {
    const previousButton = document.getElementById("previous-btn");
    const nextButton = document.getElementById("next-btn");
    const submitButton = document.getElementById("submit-btn");

    if (previousButton) {
        previousButton.disabled = currentIndex === 0;
    }

    const isLastQuestion = currentIndex === currentQuestions.length - 1;

    if (nextButton) {
        nextButton.style.display = isLastQuestion ? "none" : "";
    }

    if (submitButton) {
        submitButton.style.display = isLastQuestion ? "" : "none";
    }
}

function showQuestion() {
    if (currentIndex < 0 || currentIndex >= currentQuestions.length) return;

    const question = currentQuestions[currentIndex];

    document.getElementById("question-counter").textContent =
        `Question ${currentIndex + 1} / ${currentQuestions.length}`;

    document.getElementById("score-display").textContent =
        `Answered: ${answeredQuestions.filter(Boolean).length} / ${currentQuestions.length}`;

    document.getElementById("question-text").textContent = question.question;

    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;
    document.getElementById("progress-bar").style.width = progress + "%";

    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "";

    question.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.textContent = option;
        button.classList.add("option-btn");

        if (userAnswers[currentIndex] === index) {
            button.classList.add("selected");
            button.style.border = "3px solid #4c8bf5";
        }

        button.onclick = () => selectAnswer(index);

        optionsContainer.appendChild(button);
    });

    updateNavigation();
}

function selectAnswer(selectedIndex) {
    if (examSubmitted) return;

    userAnswers[currentIndex] = selectedIndex;
    answeredQuestions[currentIndex] = true;

    const buttons = document.querySelectorAll("#options-container button");

    buttons.forEach((button, index) => {
        button.classList.remove("selected");
        button.style.border = "";

        if (index === selectedIndex) {
            button.classList.add("selected");
            button.style.border = "3px solid #4c8bf5";
        }
    });

    document.getElementById("score-display").textContent =
        `Answered: ${answeredQuestions.filter(Boolean).length} / ${currentQuestions.length}`;

    saveProgress("quiz");
}

function nextQuestion() {
    if (examSubmitted) return;

    if (currentIndex >= currentQuestions.length - 1) return;

    currentIndex++;

    saveProgress("quiz");
    showQuestion();
}

function previousQuestion() {
    if (examSubmitted) return;

    if (currentIndex <= 0) return;

    currentIndex--;

    saveProgress("quiz");
    showQuestion();
}

function submitExam() {
    if (examSubmitted) return;

    const unansweredCount = answeredQuestions.filter(answer => !answer).length;

    if (unansweredCount > 0) {
        const confirmSubmit = confirm(
            `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`
        );

        if (!confirmSubmit) return;
    } else {
        const confirmSubmit = confirm("Are you sure you want to submit your exam?");
        if (!confirmSubmit) return;
    }

    calculateScore();

    examSubmitted = true;

    saveProgress("result");

    showResults();
}

function calculateScore() {
    score = 0;

    currentQuestions.forEach((question, index) => {
        if (!answeredQuestions[index]) return;

        const correctIndex = question.options.findIndex(
            option => option === question.answer
        );

        if (userAnswers[index] === correctIndex) {
            score++;
        }
    });
}

function showResults() {
    calculateScore();

    hideAllScreens();

    const resultScreen = document.getElementById("result-screen");
    resultScreen.classList.remove("hidden");

    document.getElementById("final-score").textContent =
        `${score} / ${currentQuestions.length}`;

    const percentage = currentQuestions.length
        ? (score / currentQuestions.length) * 100
        : 0;

    document.getElementById("result-message").textContent =
        `Your score: ${percentage.toFixed(1)}%`;

    showReview();
}

function showReview() {
    const resultScreen = document.getElementById("result-screen");

    let reviewContainer = document.getElementById("review-container");

    if (!reviewContainer) {
        reviewContainer = document.createElement("div");
        reviewContainer.id = "review-container";
        resultScreen.appendChild(reviewContainer);
    }

    reviewContainer.innerHTML = "<h2>Exam Review</h2>";

    currentQuestions.forEach((question, index) => {
        const correctIndex = question.options.findIndex(
            option => option === question.answer
        );

        const selectedIndex = userAnswers[index];

        const isCorrect =
            answeredQuestions[index] && selectedIndex === correctIndex;

        const reviewItem = document.createElement("div");

        reviewItem.style.padding = "15px";
        reviewItem.style.margin = "12px 0";
        reviewItem.style.border = "1px solid #ccc";
        reviewItem.style.borderRadius = "10px";

        const questionTitle = document.createElement("h3");
        questionTitle.textContent = `Question ${index + 1}: ${question.question}`;

        const yourAnswer = document.createElement("p");

        yourAnswer.textContent = answeredQuestions[index]
            ? `Your answer: ${question.options[selectedIndex]}`
            : "Your answer: Not answered";

        const correctAnswer = document.createElement("p");
        correctAnswer.textContent = `Correct answer: ${question.answer}`;

        const status = document.createElement("p");
        status.textContent = isCorrect ? "Correct" : "Incorrect";
        status.style.fontWeight = "bold";

        reviewItem.appendChild(questionTitle);
        reviewItem.appendChild(yourAnswer);
        reviewItem.appendChild(correctAnswer);
        reviewItem.appendChild(status);

        reviewContainer.appendChild(reviewItem);
    });
}

function restartQuiz() {
    startQuiz(selectedMode);
}

function goBack(screenId) {
    hideAllScreens();
    document.getElementById(screenId).classList.remove("hidden");
}

function goHome() {
    clearProgress();

    hideAllScreens();

    document.getElementById("welcome-screen").classList.remove("hidden");
}

function restoreProgress() {
    let saved;

    try {
        saved = localStorage.getItem(SAVE_KEY);
    } catch (error) {
        console.error("Could not read saved progress:", error);
        return;
    }

    if (!saved) return;

    try {
        const progress = JSON.parse(saved);

        selectedDepartment = progress.department;
        selectedSubject = progress.subject;
        selectedMode = progress.mode;
        currentIndex = progress.index;

        currentQuestions = buildQuestionList();

        if (currentQuestions.length === 0) {
            clearProgress();
            return;
        }

        if (currentIndex < 0 || currentIndex >= currentQuestions.length) {
            clearProgress();
            return;
        }

        userAnswers = progress.userAnswers ||
            new Array(currentQuestions.length).fill(null);

        answeredQuestions = progress.answeredQuestions ||
            new Array(currentQuestions.length).fill(false);

        // Compatibility with the previous saved format
        if (!progress.userAnswers && progress.answered) {
            userAnswers[currentIndex] = progress.selectedAnswerIndex;
            answeredQuestions[currentIndex] = true;
        }

        // Ensure saved arrays match the question count
        if (userAnswers.length !== currentQuestions.length) {
            userAnswers = new Array(currentQuestions.length).fill(null);
        }

        if (answeredQuestions.length !== currentQuestions.length) {
            answeredQuestions = new Array(currentQuestions.length).fill(false);
        }

        examSubmitted = progress.examSubmitted || progress.screen === "result";

        calculateScore();

        if (examSubmitted) {
            showResults();
            return;
        }

        hideAllScreens();

        document.getElementById("quiz-screen").classList.remove("hidden");

        showQuestion();

    } catch (error) {
        console.error("Could not restore quiz:", error);
        clearProgress();
    }
}

window.addEventListener("load", restoreProgress);
