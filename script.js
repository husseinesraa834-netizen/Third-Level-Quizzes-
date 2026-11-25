
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let selectedAnswerIndex = null;

let selectedDepartment = "";
let selectedSubject = "";
let selectedMode = "";

const SAVE_KEY = "nursingQuizProgress";

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
    },
};

function saveProgress(screen = "quiz") {
    const progress = {
        department: selectedDepartment,
        subject: selectedSubject,
        mode: selectedMode,
        index: currentIndex,
        score: score,
        answered: answered,
        selectedAnswerIndex: selectedAnswerIndex,
        screen: screen
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
}

function clearProgress() {
    localStorage.removeItem(SAVE_KEY);
}

function restoreProgress() {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) return;

    try {
        const progress = JSON.parse(saved);

        selectedDepartment = progress.department;
        selectedSubject = progress.subject;
        selectedMode = progress.mode;
        currentIndex = progress.index;
        score = progress.score;
        answered = progress.answered;
        selectedAnswerIndex = progress.selectedAnswerIndex;

        let subjectBank = questionBank[selectedSubject];

        if (!subjectBank && questionBank.mcq && questionBank.tf) {
            subjectBank = questionBank;
        }

        if (!subjectBank) {
            clearProgress();
            return;
        }

        const mcqQuestions = subjectBank.mcq || [];
        const tfQuestions = subjectBank.tf || [];

        if (selectedMode === "mcq") {
            currentQuestions = [...mcqQuestions];
        } else if (selectedMode === "tf") {
            currentQuestions = [...tfQuestions];
        } else {
            currentQuestions = [...mcqQuestions, ...tfQuestions];
        }

        if (
            currentQuestions.length === 0 ||
            currentIndex >= currentQuestions.length
        ) {
            clearProgress();
            return;
        }

        hideAllScreens();

        if (progress.screen === "result") {
            showResults();
        } else {
            document.getElementById("quiz-screen").classList.remove("hidden");
            showQuestion();
        }

    } catch (error) {
        clearProgress();
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

    document.getElementById("department-title").textContent =
        department.title;

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

    document.getElementById("subject-selected-title").textContent =
        subjectName;

    hideAllScreens();
    document.getElementById("mode-screen").classList.remove("hidden");
}

function startQuiz(mode) {
    selectedMode = mode;

    let subjectBank = questionBank[selectedSubject];

    if (!subjectBank && questionBank.mcq && questionBank.tf) {
        subjectBank = questionBank;
    }

    if (!subjectBank) {
        alert("Questions for this subject have not been added yet.");
        return;
    }

    let mcqQuestions = subjectBank.mcq || [];
    let tfQuestions = subjectBank.tf || [];

    if (mode === "mcq") {
        currentQuestions = [...mcqQuestions];
    } else if (mode === "tf") {
        currentQuestions = [...tfQuestions];
    } else {
        currentQuestions = [...mcqQuestions, ...tfQuestions];
    }

    if (currentQuestions.length === 0) {
        alert("No questions available for this quiz yet.");
        return;
    }

    currentIndex = 0;
    score = 0;
    answered = false;
    selectedAnswerIndex = null;

    saveProgress();

    hideAllScreens();
    document.getElementById("quiz-screen").classList.remove("hidden");

    showQuestion();
}

function showQuestion() {
    const question = currentQuestions[currentIndex];

    document.getElementById("question-counter").textContent =
        `Question ${currentIndex + 1} / ${currentQuestions.length}`;

    document.getElementById("score-display").textContent =
        `Score: ${score}`;

    document.getElementById("question-text").textContent =
        question.question;

    const progress = ((currentIndex + 1) / currentQuestions.length) * 100;

    document.getElementById("progress-bar").style.width =
        progress + "%";

    const optionsContainer =
        document.getElementById("options-container");

    optionsContainer.innerHTML = "";

    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "";

    const nextButton = document.getElementById("next-btn");
    nextButton.disabled = !answered;

    question.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.textContent = option;
        button.classList.add("option-btn");

        button.onclick = () => selectAnswer(index);

        optionsContainer.appendChild(button);
    });

    // Restore the previous answer if this question was already answered
    if (answered) {
        const buttons = document.querySelectorAll("#options-container button");

        const correctIndex = question.options.findIndex(option =>
            option === question.answer
        );

        buttons.forEach((button, index) => {
            button.disabled = true;

            if (index === correctIndex) {
                button.classList.add("correct");
            }

            if (
                index === selectedAnswerIndex &&
                index !== correctIndex
            ) {
                button.classList.add("wrong");
            }
        });

        if (selectedAnswerIndex === correctIndex) {
            feedback.textContent = "Correct!";
            feedback.className = "correct-feedback";
        } else {
            feedback.textContent =
                `Incorrect! Correct answer: ${question.answer}`;

            feedback.className = "wrong-feedback";
        }

        nextButton.disabled = false;
    }
}

function selectAnswer(selectedIndex) {
    if (answered) return;

    answered = true;
    selectedAnswerIndex = selectedIndex;

    const question = currentQuestions[currentIndex];
    const buttons = document.querySelectorAll("#options-container button");

    const selectedOption = question.options[selectedIndex];

    const correctIndex = question.options.findIndex(option =>
        option === question.answer
    );

    buttons.forEach((button, index) => {
        button.disabled = true;

        if (index === correctIndex) {
            button.classList.add("correct");
        }

        if (index === selectedIndex && index !== correctIndex) {
            button.classList.add("wrong");
        }
    });

    const feedback = document.getElementById("feedback");

    if (selectedOption === question.answer) {
        score++;

        feedback.textContent = "Correct!";
        feedback.className = "correct-feedback";
    } else {
        feedback.textContent =
            `Incorrect! Correct answer: ${question.answer}`;

        feedback.className = "wrong-feedback";
    }

    document.getElementById("score-display").textContent =
        `Score: ${score}`;

    document.getElementById("next-btn").disabled = false;

    saveProgress();
}

function nextQuestion() {
    if (!answered) return;

    currentIndex++;

    if (currentIndex < currentQuestions.length) {
        answered = false;
        selectedAnswerIndex = null;

        saveProgress();
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    saveProgress("result");

    hideAllScreens();

    document.getElementById("result-screen").classList.remove("hidden");

    document.getElementById("final-score").textContent =
        `${score} / ${currentQuestions.length}`;

    const percentage = (score / currentQuestions.length) * 100;

    document.getElementById("result-message").textContent =
        `Your score: ${percentage.toFixed(1)}%`;
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

// Automatically restore the saved quiz when the page loads
restoreProgress();

