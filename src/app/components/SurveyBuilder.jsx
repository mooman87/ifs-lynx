"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const inputClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const textareaClass =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 text-[#151b2f] outline-none placeholder:text-[#8a8983] focus:border-[#AFA9EC] focus:ring-4 focus:ring-[#EEEDFE]";

const QuestionTypeLabel = ({ responses = [] }) => {
  let label = "Open response";

  const normalized = responses.filter((r) => String(r || "").trim() !== "");

  if (normalized.length === 2) {
    const joined = normalized.join(" / ").toLowerCase();
    if (joined.includes("yes") && joined.includes("no")) {
      label = "Yes / No";
    } else {
      label = "2 choices";
    }
  } else if (normalized.length === 3) {
    const joined = normalized.join(" / ").toLowerCase();
    if (
      joined.includes("yes") &&
      joined.includes("no") &&
      joined.includes("maybe")
    ) {
      label = "Yes / No / Maybe";
    } else {
      label = "3 choices";
    }
  } else if (normalized.length > 0) {
    label = `${normalized.length} choices`;
  }

  return <div className="mt-1 text-sm text-[#8a8983]">{label}</div>;
};

const QuestionCard = ({
  q,
  qIndex,
  handleQuestionChange,
  handleRemoveQuestion,
  handleAddResponse,
  handleRemoveResponse,
  handleResponseChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(
    !q.questionText || q.responses.length === 0,
  );

  return (
    <div className="rounded-[22px] border border-black/5 bg-[#f8f7fb] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
          {qIndex + 1}
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full text-left"
          >
            <div className="text-[15px] font-semibold leading-6 text-[#151b2f]">
              {q.questionText?.trim() || `Question ${qIndex + 1}`}
            </div>
            <QuestionTypeLabel responses={q.responses} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#8a8983] transition hover:bg-[#f3f1ec] hover:text-[#151b2f]"
            aria-label={isExpanded ? "Collapse question" : "Expand question"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M7 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleRemoveQuestion(qIndex)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
            aria-label="Remove question"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
              Question text
            </label>
            <input
              type="text"
              className={inputClass}
              value={q.questionText}
              onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
              placeholder={`Question ${qIndex + 1}`}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                Responses
              </label>
              <button
                type="button"
                className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-3 py-1.5 text-xs font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
                onClick={() => handleAddResponse(qIndex)}
              >
                + Add response
              </button>
            </div>

            <div className="space-y-2">
              {q.responses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-[#8a8983]">
                  No responses yet. Add choices or leave blank for open
                  response.
                </div>
              ) : null}

              {q.responses.map((r, rIndex) => (
                <div key={rIndex} className="flex items-center gap-2">
                  <input
                    type="text"
                    className={inputClass}
                    value={r}
                    onChange={(e) =>
                      handleResponseChange(qIndex, rIndex, e.target.value)
                    }
                    placeholder={`Response ${rIndex + 1}`}
                  />
                  <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    onClick={() => handleRemoveResponse(qIndex, rIndex)}
                    aria-label="Remove response"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 5l10 10M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SurveyBuilder = ({ projectSurvey, onSurveyUpdate }) => {
  const [introduction, setIntroduction] = useState("");
  const [questions, setQuestions] = useState([]);
  const [closeMessage, setCloseMessage] = useState("");
  const { id } = useParams();

  useEffect(() => {
    if (projectSurvey) {
      setIntroduction(projectSurvey.introduction || "");
      setQuestions(projectSurvey.questions || []);
      setCloseMessage(projectSurvey.closeMessage || "");
    }
  }, [projectSurvey]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", responses: [] }]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = value;
    setQuestions(newQuestions);
  };

  const handleAddResponse = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].responses.push("");
    setQuestions(newQuestions);
  };

  const handleRemoveResponse = (qIndex, rIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].responses.splice(rIndex, 1);
    setQuestions(newQuestions);
  };

  const handleResponseChange = (qIndex, rIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].responses[rIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSaveSurvey = async () => {
    const survey = {
      introduction,
      questions,
      closeMessage,
    };

    try {
      const res = await fetch(`/api/project/${id}/survey`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ survey }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Survey saved successfully!");
        if (onSurveyUpdate) onSurveyUpdate(data.survey);
      } else {
        console.error(data.message);
        alert("Error saving survey");
      }
    } catch (error) {
      console.error("Error saving survey:", error);
      alert("Error saving survey");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#151b2f]">
                Door script
              </h2>
              <p className="mt-1 text-sm text-[#8a8983]">
                Opening and closing language for canvassers in the field.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                Introduction
              </label>
              <textarea
                className={`${textareaClass} min-h-[140px] bg-[#f8f7fb]`}
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                placeholder='e.g. "Hi, my name is [NAME] and I&apos;m volunteering with the [CAMPAIGN] campaign..."'
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94938c]">
                Close message
              </label>
              <textarea
                className={`${textareaClass} min-h-[110px] bg-[#f8f7fb]`}
                value={closeMessage}
                onChange={(e) => setCloseMessage(e.target.value)}
                placeholder="Closing language, follow-up ask, or thank-you message..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveSurvey}
                className="rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-5 py-2.5 text-sm font-semibold text-[#3C3489] transition hover:bg-[#CECBF6]"
              >
                Save survey
              </button>

              <button
                type="button"
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-[#7a7972] transition hover:bg-[#f3f1ec]"
              >
                Edit script
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#151b2f]">
                Survey questions
              </h2>
              <p className="mt-1 text-sm text-[#8a8983]">
                Build the form canvassers will use at the door.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-black/10 bg-[#f8f7fb] px-4 py-6 text-center text-sm text-[#8a8983]">
                No questions yet. Add your first question to start building the
                survey.
              </div>
            ) : null}

            {questions.map((q, qIndex) => (
              <QuestionCard
                key={qIndex}
                q={q}
                qIndex={qIndex}
                handleQuestionChange={handleQuestionChange}
                handleRemoveQuestion={handleRemoveQuestion}
                handleAddResponse={handleAddResponse}
                handleRemoveResponse={handleRemoveResponse}
                handleResponseChange={handleResponseChange}
              />
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex w-full items-center justify-center rounded-[20px] border border-dashed border-[#AFA9EC] bg-[#F6F4FF] px-4 py-4 text-base font-semibold text-[#534AB7] transition hover:bg-[#EEEDFE]"
            >
              + Add question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyBuilder;
