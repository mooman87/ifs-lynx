"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
    <div className="bg-white rounded shadow p-4 mt-8">
      <h2 className="text-xl font-semibold mb-3">Survey Builder</h2>
      <div className="mb-4">
        <label className="block font-bold mb-1">Introduction</label>
        <textarea
          className="w-full border p-2 rounded"
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="Enter survey introduction..."
        />
      </div>
      <div className="mb-4">
        <h3 className="font-bold mb-2">Questions</h3>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="border p-2 mb-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <input
                type="text"
                className="w-full border p-1 rounded"
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                placeholder={`Question ${qIndex + 1}`}
              />
              <button
                className="ml-2 text-red-500 font-bold"
                onClick={() => handleRemoveQuestion(qIndex)}
              >
                Remove
              </button>
            </div>
            <div className="ml-4">
              <h4 className="font-semibold mb-1">Responses</h4>
              {q.responses.map((r, rIndex) => (
                <div key={rIndex} className="flex items-center mb-1">
                  <input
                    type="text"
                    className="w-full border p-1 rounded"
                    value={r}
                    onChange={(e) =>
                      handleResponseChange(qIndex, rIndex, e.target.value)
                    }
                    placeholder={`Response ${rIndex + 1}`}
                  />
                  <button
                    className="ml-2 text-red-500 font-bold"
                    onClick={() => handleRemoveResponse(qIndex, rIndex)}
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                onClick={() => handleAddResponse(qIndex)}
              >
                Add Response
              </button>
            </div>
          </div>
        ))}
        <button
          className="mt-2 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
          onClick={handleAddQuestion}
        >
          Add Question
        </button>
      </div>
      <div className="mb-4">
        <label className="block font-bold mb-1">Close Message</label>
        <textarea
          className="w-full border p-2 rounded"
          value={closeMessage}
          onChange={(e) => setCloseMessage(e.target.value)}
          placeholder="Enter closing message..."
        />
      </div>
      <button
        onClick={handleSaveSurvey}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
      >
        Save Survey
      </button>
    </div>
  );
};

export default SurveyBuilder;
