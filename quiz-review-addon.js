(function () {
  function safeGet(name) {
    try {
      return Function("return typeof " + name + " !== 'undefined' ? " + name + " : undefined;")();
    } catch (_) {
      return undefined;
    }
  }

  function getQuizData() {
    return safeGet("quizData");
  }

  function getSelectedAnswers() {
    return safeGet("selectedAnswers");
  }

  function getTr() {
    return safeGet("tr") || {};
  }

  function getQuestionElements() {
    return Array.prototype.slice.call(document.querySelectorAll(".question"));
  }

  function getQuestionData(questionIndex) {
    var data = getQuizData();
    if (!Array.isArray(data)) return null;

    return data[questionIndex] || null;
  }

  function getOptionByLabel(question, label) {
    if (!question || !Array.isArray(question.options) || !label) return null;

    for (var i = 0; i < question.options.length; i++) {
      if (question.options[i].label === label) return question.options[i];
    }

    return null;
  }

  function getChosenOption(questionIndex, label) {
    var question = getQuestionData(questionIndex);
    return getOptionByLabel(question, label);
  }

  function getCorrectOption(questionIndex) {
    var question = getQuestionData(questionIndex);
    if (!question || !Array.isArray(question.options)) return null;

    for (var i = 0; i < question.options.length; i++) {
      if (question.options[i].isCorrect) return question.options[i];
    }

    return null;
  }

  function ensureStyles() {
    if (document.getElementById("review-addon-style")) return;

    var style = document.createElement("style");
    style.id = "review-addon-style";
    style.textContent = [
      ".review-panel { margin-top: 16px; text-align: left; }",
      ".review-actions { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }",
      ".review-filter { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; }",
      ".review-filter input { width: 16px; height: 16px; cursor: pointer; }",
      ".review-list { max-height: 70vh; overflow-y: auto; display: grid; gap: 12px; padding-right: 4px; }",
      ".review-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; }",
      ".review-question { margin: 0 0 10px; white-space: pre-wrap; line-height: 1.45; color: #111827; }",
      ".review-line { padding: 8px 10px; border-radius: 8px; margin: 6px 0; font-size: 14px; line-height: 1.45; }",
      ".review-line.user-correct { background: #ecfdf5; color: #065f46; }",
      ".review-line.user-wrong { background: #fef2f2; color: #991b1b; }",
      ".review-line.correct-answer { background: #eef2ff; color: #3730a3; }",
      ".review-line.rationale { background: #f8fafc; color: #334155; }",
      ".review-empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; color: #475569; text-align: center; }"
    ].join("\n");
    document.head.appendChild(style);
  }

  function createLine(className, text) {
    var line = document.createElement("div");
    line.className = "review-line " + className;
    line.textContent = text;
    return line;
  }

  function renderReviewList(wrongOnly) {
    var data = getQuizData();
    var answers = getSelectedAnswers();
    var trData = getTr();
    var questionElements = getQuestionElements();
    if (!Array.isArray(data) || !Array.isArray(answers) || !questionElements.length) return null;

    var list = document.createElement("div");
    list.className = "review-list";

    var userLabel = trData.userAnswer || "Bạn chọn";
    var correctLabel = trData.rightAnswer || "Đáp án đúng";
    var rationaleLabel = trData.rationaleLabel || "Giải thích";
    var noAnswerLabel = trData.noAnswer || "Chưa trả lời";
    var visibleCount = 0;

    for (var i = 0; i < questionElements.length; i++) {
      var questionEl = questionElements[i];
      var questionIndex = parseInt(questionEl && questionEl.dataset ? questionEl.dataset.index : "", 10);
      if (isNaN(questionIndex)) questionIndex = i;

      var q = data[questionIndex];
      var selectedLabel = answers[i];
      var chosen = getChosenOption(questionIndex, selectedLabel);
      var correct = getCorrectOption(questionIndex);
      var isCorrect = !!(chosen && correct && chosen.label === correct.label);
      if (wrongOnly && isCorrect) continue;

      visibleCount++;

      var card = document.createElement("section");
      card.className = "review-card";

      var questionText = document.createElement("p");
      questionText.className = "review-question";
      questionText.textContent = (q && q.question) ? q.question : "";
      card.appendChild(questionText);

      var selectedText = chosen ? (chosen.label + ". " + chosen.text) : noAnswerLabel;
      card.appendChild(createLine(isCorrect ? "user-correct" : "user-wrong", userLabel + ": " + selectedText));

      if (!isCorrect && correct) {
        card.appendChild(createLine("correct-answer", correctLabel + ": " + correct.label + ". " + correct.text));
      }

      var rationale = "";
      if (correct && correct.rationale) rationale = correct.rationale;
      else if (chosen && chosen.rationale) rationale = chosen.rationale;

      if (rationale && rationale.trim()) {
        card.appendChild(createLine("rationale", rationaleLabel + ": " + rationale));
      }

      list.appendChild(card);
    }

    if (visibleCount === 0) {
      var empty = document.createElement("div");
      empty.className = "review-empty";
      empty.textContent = "Khong co cau sai de hien thi.";
      list.appendChild(empty);
    }

    return list;
  }

  function hideSummaryAndShowReview(resultsEl, panelEl) {
    var children = resultsEl.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i] !== panelEl) {
        children[i].classList.add("hidden");
      }
    }
    panelEl.classList.remove("hidden");
  }

  function showSummaryAndHideReview(resultsEl, panelEl) {
    var children = resultsEl.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i] !== panelEl) {
        children[i].classList.remove("hidden");
      }
    }
    panelEl.classList.add("hidden");
  }

  function ensureReviewUI() {
    var results = document.getElementById("results");
    if (!results) return;

    if (results.querySelector(".review-toggle-btn")) return;

    ensureStyles();

    var reviewBtn = document.createElement("button");
    reviewBtn.className = "restart-btn review-toggle-btn";
    reviewBtn.type = "button";
    reviewBtn.textContent = "Xem lại câu hỏi";
    reviewBtn.style.marginLeft = "12px";

    var panel = document.createElement("div");
    panel.className = "review-panel hidden";

    var actions = document.createElement("div");
    actions.className = "review-actions";

    var backBtn = document.createElement("button");
    backBtn.className = "restart-btn";
    backBtn.type = "button";
    backBtn.textContent = "Xem lại điểm số";

    var filterWrap = document.createElement("label");
    filterWrap.className = "review-filter";

    var wrongOnlyToggle = document.createElement("input");
    wrongOnlyToggle.type = "checkbox";

    var filterText = document.createElement("span");
    filterText.textContent = "Chỉ xem câu sai";

    filterWrap.appendChild(wrongOnlyToggle);
    filterWrap.appendChild(filterText);

    actions.appendChild(backBtn);
    actions.appendChild(filterWrap);
    panel.appendChild(actions);

    var listRoot = document.createElement("div");
    listRoot.className = "review-list";
    panel.appendChild(listRoot);

    var restartBtn = results.querySelector(".restart-btn");
    if (restartBtn && restartBtn.parentNode) {
      restartBtn.insertAdjacentElement("afterend", reviewBtn);
    } else {
      results.appendChild(reviewBtn);
    }

    results.appendChild(panel);

    function rerenderReviewList() {
      var rendered = renderReviewList(wrongOnlyToggle.checked);
      if (!rendered) return;
      listRoot.replaceWith(rendered);
      listRoot = rendered;
    }

    reviewBtn.addEventListener("click", function () {
      rerenderReviewList();
      hideSummaryAndShowReview(results, panel);
    });

    wrongOnlyToggle.addEventListener("change", function () {
      rerenderReviewList();
    });

    backBtn.addEventListener("click", function () {
      showSummaryAndHideReview(results, panel);
    });
  }

  function resetReviewUI() {
    var results = document.getElementById("results");
    if (!results) return;

    var panel = results.querySelector(".review-panel");
    if (!panel) return;

    showSummaryAndHideReview(results, panel);
  }

  function patchLifecycle() {
    if (typeof window.showResults !== "function" || typeof window.restart !== "function") return;

    if (window.__reviewAddonPatched) return;
    window.__reviewAddonPatched = true;

    var originalShowResults = window.showResults;
    var originalRestart = window.restart;

    window.showResults = function () {
      originalShowResults.apply(this, arguments);
      ensureReviewUI();
      resetReviewUI();
    };

    window.restart = function () {
      originalRestart.apply(this, arguments);
      resetReviewUI();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchLifecycle);
  } else {
    patchLifecycle();
  }
})();
