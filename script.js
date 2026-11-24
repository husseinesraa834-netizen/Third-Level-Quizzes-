
let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

let selectedDepartment = "";
let selectedSubject = "";
let selectedMode = "";

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

    obgyn: {
        title: "Obstetrics & Gynecological Health Department",
        subjects: [
            { key: "obstetricNursing", name: "Obstetric Nursing" },
            { key: "obstetricsGynecology", name: "Obstetrics and Gynecology" },
            { key: "criticalCareEmergency", name: "Critical Care and Emergency Nursing" },
            { key: "statistics", name: "Statistics" },
            { key: "humanBehavior", name: "Human Behavior" },
            { key: "pediatricEmergencies", name: "Pediatric Emergencies" }
        ]
    }
};

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

    // Get the question bank for the selected subject
    let subjectBank = questionBank[selectedSubject];

    // Temporary compatibility with the old question-bank structure
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

    hideAllScreens();
    document.getElementById("quiz-screen").classList.remove("hidden");

    showQuestion();
}

function showQuestion() {
    answered = false;

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

    document.getElementById("feedback").textContent = "";

    const nextButton = document.getElementById("next-btn");
    nextButton.disabled = true;

    question.options.forEach((option, index) => {
        const button = document.createElement("button");

        button.textContent = option;
        button.classList.add("option-btn");

        button.onclick = () => selectAnswer(index);

        optionsContainer.appendChild(button);
    });
}

function selectAnswer(selectedIndex) {
    if (answered) return;

    answered = true;

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
}

function nextQuestion() {
    if (!answered) return;

    currentIndex++;

    if (currentIndex < currentQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
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
    hideAllScreens();
    document.getElementById("welcome-screen").classList.remove("hidden");
}
