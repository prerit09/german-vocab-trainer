import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [words, setWords] = useState([]);
  const [page, setPage] = useState("home"); // home | quiz | review
  const [mode, setMode] = useState("quiz"); // quiz | review
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [attemptedWords, setAttemptedWords] = useState([]);
  const [selectedReviewList, setSelectedReviewList] = useState(null);
  const [reviewLists, setReviewLists] = useState(() => {
    const saved = localStorage.getItem("reviewLists");
    return saved ? JSON.parse(saved) : [];
  });
  const [newListName, setNewListName] = useState("");
  const [showSaveList, setShowSaveList] = useState(false);
  const [currentReviewWords, setCurrentReviewWords] = useState([]);
  const [quizWords, setQuizWords] = useState([]);
  const [level, setLevel] = useState("b1ch1"); // "a1" | "a2" | "b1"

  // const [completedChunks, setCompletedChunks] = useState(() => {
  //   const saved = localStorage.getItem("completedChunks");
  //   return saved ? JSON.parse(saved) : {};
  // });

  const CHUNK_SIZE = 25;

  function getWordsUrl(level) {
    switch(level) {
      // case "a1": return import.meta.env.BASE_URL + "data/a1-nouns.json";
      // case "a2": return import.meta.env.BASE_URL + "data/a2-nouns.json";
      // case "b1": return import.meta.env.BASE_URL + "data/b1-nouns.json";
      case "b1ch1": return import.meta.env.BASE_URL + "data/b1-ch-1.json";
      case "b1ch2": return import.meta.env.BASE_URL + "data/b1-ch-2.json";
      case "b1ch2adj": return import.meta.env.BASE_URL + "data/b1-ch-2-adjectiv.json";
      default: throw new Error("Unknown level: " + level);
    }
  }

  // Fetch words whenever the level changes
  useEffect(() => {
    // setWords([]); // clear old words while fetching new level
    fetch(getWordsUrl(level))
      .then(res => res.json())
      .then(setWords)
      .catch(err => console.error("Failed to load words", err));
  }, [level]);

  const totalChunks = Math.ceil(words.length / CHUNK_SIZE);

  function startQuiz(chunkIndex = 0) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = start + CHUNK_SIZE;
    setQuizWords(words.slice(start, end));
    setPage("quiz");
    setMode("quiz");
    setIndex(0);
    setAttemptedWords([]);
    setSelected(null);
    setShowEnglish(false);
  }

  function startReview(list) {
    setCurrentReviewWords(list.words);
    setPage("review");
    setMode("review");
    setIndex(0);
    setAttemptedWords([]);
    setSelected(null);
    setShowEnglish(false);
  }

  function backToHome() {
    setPage("home");
    setIndex(0);
    setSelected(null);
    setShowEnglish(false);
  }

  function deleteReviewList(i) {
    const updated = reviewLists.filter((_, idx) => idx !== i);
    setReviewLists(updated);
    localStorage.setItem("reviewLists", JSON.stringify(updated));
  }

  function currentWord() {
    return mode === "quiz" ? quizWords[index] : currentReviewWords[index];
  }

  function chooseArticle(article) {
    if (selected) return;

    setSelected(article);
    setShowEnglish(true); // 👈 immediately show English

    setAttemptedWords(prev => [
      ...prev,
      { ...currentWord(), selected: article, addToList: false }
    ]);
  }

  function markAnswer(isCorrect) {
    if (selected) return;

    setSelected(isCorrect ? "correct" : "incorrect");

    setAttemptedWords(prev => [
      ...prev,
      {
        ...currentWord(),
        selected: isCorrect ? "correct" : "wrong", // ✅ always a string
        isManual: true,
        addToList: false // ✅ ensure checkbox is not pre-checked
      }
    ]);

    nextWord();
  }

  function nextWord() {
    setSelected(null);
    setShowEnglish(false);
    setIndex(i => i + 1);
  }

  function toggleWordForList(id) {
    setAttemptedWords(prev =>
      prev.map(w => (w.id === id ? { ...w, addToList: !w.addToList } : w))
    );
  }

  function selectAllIncorrect() {
    setAttemptedWords(prev =>
      prev.map(w => ((w.isManual 
                      ? w.selected !== "correct"
                      : w.selected !== w.article) ? { ...w, addToList: true } : w))
    );
  }

  function selectAllCorrect() {
    setAttemptedWords(prev =>
      prev.map(w => ((w.isManual 
                      ? w.selected === "correct"
                      : w.selected === w.article) ? { ...w, addToList: true } : w))
    );
  }

  function clearSelection() {
    setAttemptedWords(prev => prev.map(w => ({ ...w, addToList: false })));
  }

  function saveReviewList() {
    const selectedWords = attemptedWords.filter(w => w.addToList);
    if (!selectedWords.length) return;

    if (selectedReviewList !== null) {
      // Add to existing list
      const updated = reviewLists.map((list, i) =>
        i === selectedReviewList ? { ...list, words: [...list.words, ...selectedWords] } : list
      );
      setReviewLists(updated);
      localStorage.setItem("reviewLists", JSON.stringify(updated));
    } else if (newListName) {
      // Create new list
      const updated = [...reviewLists, { name: newListName, words: selectedWords }];
      setReviewLists(updated);
      localStorage.setItem("reviewLists", JSON.stringify(updated));
    }

    setShowSaveList(false);
    setNewListName("");
    setSelectedReviewList(null);
  }

  // ------------------ HOME PAGE ------------------
  if (page === "home") {
    return (
      <div style={styles.outer}>
        <div style={styles.container}>
        <h1 style={styles.h1} className="animated-title">Vokabix</h1>
          <p className="byline">by Prerit Jain!</p>
          <h3 style={styles.h3}>Start Quiz (Chunks of 25 words)</h3>

          {/* LEVEL SELECTOR */}
          <div className="level-selector">
            <h3 style={styles.h3}>Select Level:</h3>

            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="level-dropdown"
            >
              <option value="b1ch1">B1 - Einheit - 1</option>
              <option value="b1ch2">B1 - Einheit - 2</option>
              <option value="b1ch2adj">B1 - Einheit - 2 - Adjectiv</option>
              {/* <option value="a1">A1</option>
              <option value="a2">A2</option>
              <option value="b1">B1</option> */}
            </select>
          </div>
          
          <hr className="section-divider" />

          {/* 25 WORDS CHUNK BUTTONS */}
          <div style={styles.flexWrap}>
            {words.length === 0 ? (
              <p>Loading words…</p>
            ) : (
              Array.from({ length: totalChunks }).map((_, i) => (
                <button
                  key={i}
                  style={styles.button}
                  onClick={() => startQuiz(i)}
                >
                  Words {i * CHUNK_SIZE + 1} - {Math.min((i + 1) * CHUNK_SIZE, words.length)}
                </button>
              ))
            )}
          </div>

          <hr className="section-divider" />

          {/* REVIEW LISTS */}
          {reviewLists.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h3 style={styles.h3}>My Review Lists</h3>
              {reviewLists.map((list, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <span style={styles.h6}>{list.name} ({list.words.length}) </span>
                  <button style={styles.button} onClick={() => startReview(list)}>Review</button>
                  <button style={{ ...styles.button, background: "#f44336" }} onClick={() => deleteReviewList(i)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const word = currentWord();

  // ------------------ FINISHED ------------------
  if ((mode === "quiz" && index >= quizWords.length) || (mode === "review" && index >= currentReviewWords.length)) {
    return (
      <div style={styles.outer}>
        <div style={styles.container}>
          <h2 style={styles.h2}>Finished</h2>

          <div style={styles.flexWrap}>
            <button style={styles.button} onClick={selectAllIncorrect}>Select Incorrect</button>
            <button style={styles.button} onClick={selectAllCorrect}>Select Correct</button>
            <button style={styles.button} onClick={clearSelection}>Clear</button>
          </div>

          {attemptedWords.map(w => (
            <div key={w.id} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={w.addToList}
                onChange={() => toggleWordForList(w.id)}
              /> {w.word} ({w.isManual 
                            ? (w.selected === "correct" ? "✓" : "✗")
                            : (w.selected === w.article ? "✓" : "✗")
                          })
            </div>
          ))}

          {!showSaveList ? (
            <button style={styles.button} onClick={() => setShowSaveList(true)}>Save to Review List</button>
          ) : (
            <div style={{ marginTop: 12 }}>
              <select
                value={selectedReviewList ?? ""}
                onChange={e => setSelectedReviewList(e.target.value !== "" ? Number(e.target.value) : null)}
                style={{ padding: 8, fontSize: 16, borderRadius: 6, marginRight: 6 }}
              >
                <option value="">Create new list</option>
                {reviewLists.map((list, i) => (
                  <option key={i} value={i}>{list.name}</option>
                ))}
              </select>
              {selectedReviewList === null && (
                <input
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="List name"
                  style={{ padding: 8, fontSize: 16, borderRadius: 6, marginRight: 6 }}
                />
              )}
              <button style={styles.button} onClick={saveReviewList}>Save</button>
            </div>
          )}

          <button style={{ ...styles.button, marginTop: 20 }} onClick={backToHome}>Home</button>
        </div>
      </div>
    );
  }

  // ------------------ QUIZ WORD ------------------
  return (
    <div style={styles.outer}>
      <div style={styles.container}>
        <h2 style={styles.h2}>{mode === "quiz" ? "Quiz" : "Review"}</h2>
        <h1 style={styles.h1}>{word.word}</h1>

          {/* ----------- MAIN LOGIC ----------- */}


          {/* <div style={styles.flexWrap}> */}
            {/* ----------- WITH ARTICLE ----------- */}
            
            {word.article && word.article.trim() !== "" ? (
              <>
                {/* STEP 1: choose article */}

                <div style={{ marginBottom: 12 }}>

                {["der", "die", "das"].map(a => {
                  let btnClass = "";
                  if (selected) {
                    if (a === word.article) btnClass = "correct-flash";
                    else if (selected === a) btnClass = "wrong-flash";
                  }

                  return (
                    <button
                      key={a}
                      onClick={() => chooseArticle(a)}
                      disabled={!!selected}
                      className={btnClass}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        cursor: selected ? "default" : "pointer",
                        fontSize: 16,
                        background: selected ? (a === word.article ? "#4caf50" : selected === a ? "#f44336" : "#eee") : "#eee",
                        color: selected ? "#fff" : "#333",
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
                </div>

                {/* STEP 3: show English text */}
                {selected && showEnglish && (
                  <div style={{ marginTop: 12 }}>
                      
                    <p style={styles.h6}>{word.english}</p>

                    <button style={styles.nextButton} onClick={nextWord}>
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* WITHOUT ARTICLE */}
                {!showEnglish && (
                  <div style={{ marginBottom: 12 }}>

                    <button
                      style={styles.showEnglishButton}
                      onClick={() => setShowEnglish(true)}
                    >
                      Show English
                    </button>

                  </div>
                )}

                {showEnglish && 
                  <div style={{ marginBottom: 12 }}>
                    <p style={styles.h6}>{word.english}</p>
                  </div>
                }

                {showEnglish && !selected && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      style={{ ...styles.button, background: "#4caf50" }}
                      onClick={() => markAnswer(true)}
                    >
                      Mark as Correct
                    </button>

                    <button
                      style={{ ...styles.button, background: "#f44336" }}
                      onClick={() => markAnswer(false)}
                    >
                      Mark as Incorrect
                    </button>
                  </div>
                )}
              </>
            )}
          {/* </div> */}


          {/* ----------- MAIN LOGIC END ----------- */}

      </div>
    </div>
  );
}

const styles = {
  outer: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", background: "linear-gradient(to bottom, #8ea4bd, #dbe6f0)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  container: { width: "100%", maxWidth: 600, textAlign: "center", background: "#ffffffcc", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "20px 15px", boxSizing: "border-box" },
  h1: { fontSize: "2rem", marginBottom: 16, color: "#333" },
  h2: { fontSize: "1.5rem", marginBottom: 12, color: "#444" },
  h3: { fontSize: "1.2rem", marginBottom: 10, color: "#555" },
  h6: { fontSize: "1.2rem", marginBottom: 10, color: "#555" },
  button: { background: "#4caf50", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 16, transition: "all 0.2s ease" },
  nextButton: { marginTop: 12, padding: "10px 18px", fontSize: 16, borderRadius: 8, cursor: "pointer", border: "none", background: "#1976d2", color: "#fff", transition: "background 0.2s ease" },
  showEnglishButton: { marginTop: 12, padding: "10px 18px", fontSize: 16, borderRadius: 8, cursor: "pointer", border: "none", background: "#4caf50", color: "#fff", transition: "background 0.2s ease" },
  flexWrap: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 20 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 16, color: "#333" },
  
};
