import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Main App component for NoteMaster web notes application.
 * Layout: Sidebar (notes & search), MainArea (view/edit), responsive/mobile, minimal design.
 * Handles note CRUD, searching, selection, and theme (light).
 */
function App() {
  // Note object: {id, title, content, created, updated}
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load from localStorage on start
  useEffect(() => {
    const n = localStorage.getItem("notes_v1");
    if (n) {
      setNotes(JSON.parse(n));
    }
  }, []);

  // Save notes to localStorage on change
  useEffect(() => {
    localStorage.setItem("notes_v1", JSON.stringify(notes));
  }, [notes]);

  // Get selected note
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Filtering/search
  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    return (
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  // PUBLIC_INTERFACE
  /**
   * Create a new blank note.
   */
  const createNote = () => {
    const now = new Date().toISOString();
    // Generate unique id
    const newId =
      "note_" +
      Math.random().toString(36).slice(2) +
      "_" +
      Date.now().toString(36);
    const note = {
      id: newId,
      title: "Untitled Note",
      content: "",
      created: now,
      updated: now,
    };
    setNotes([note, ...notes]);
    setSelectedId(note.id);
    setEditing(true);
  };

  // PUBLIC_INTERFACE
  /**
   * Delete a note by id.
   * @param {string} id
   */
  const deleteNote = (id) => {
    if (
      // eslint-disable-next-line no-restricted-globals
      window.confirm("Delete this note? This cannot be undone.")
    ) {
      setNotes((ns) => ns.filter((n) => n.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setEditing(false);
      }
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Update note content (edit or create)
   * @param {string} id
   * @param {object} values - {title, content}
   */
  const updateNote = (id, values) => {
    setNotes((ns) =>
      ns.map((n) =>
        n.id === id ? { ...n, ...values, updated: new Date().toISOString() } : n
      )
    );
  };

  // PUBLIC_INTERFACE
  /**
   * Handle selecting a note to view or edit.
   * @param {string} id
   */
  const selectNote = (id) => {
    setSelectedId(id);
    setEditing(false);
    if (window.innerWidth <= 640) setSidebarOpen(false);
  };

  // Responsive: handle sidebar open/close (mobile)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keyboard shortcuts: new, delete
  useEffect(() => {
    const handler = (e) => {
      // New note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      }
      // Delete note
      if (
        selectedId &&
        (e.key === "Delete" || (e.ctrlKey && e.key.toLowerCase() === "d"))
      ) {
        e.preventDefault();
        deleteNote(selectedId);
      }
      // Focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("sidebar-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [selectedId, notes]);

  // Main render
  return (
    <div className="notes-app-root" data-theme="light">
      <Sidebar
        notes={filteredNotes}
        allNotes={notes}
        search={search}
        setSearch={setSearch}
        selectedId={selectedId}
        onSelect={selectNote}
        onCreate={createNote}
        onDelete={deleteNote}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <MainArea
        note={selectedNote}
        editing={editing}
        setEditing={setEditing}
        onSave={updateNote}
        onDelete={deleteNote}
        onEdit={() => setEditing(true)}
        onBack={() => setSidebarOpen(true)}
        isMobile={window.innerWidth <= 640}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Sidebar component: note list, create button, search.
 */
function Sidebar({
  notes,
  allNotes,
  search,
  setSearch,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  sidebarOpen,
  setSidebarOpen,
}) {
  return (
    <nav className={`sidebar${sidebarOpen ? "" : " hidden"}`}>
      <div className="sidebar-header">
        <span className="app-title">NoteMaster</span>
        <button
          className="sidebar-toggle"
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? "⟨" : "☰"}
        </button>
      </div>
      <div className="sidebar-actions">
        <button className="btn-primary" onClick={onCreate} title="New note (Ctrl+N)">
          ＋ New Note
        </button>
        <input
          id="sidebar-search"
          type="text"
          className="sidebar-search"
          placeholder="Search notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <ul className="sidebar-list" tabIndex="0">
        {notes.length === 0 ? (
          <li className="sidebar-empty">No notes found.</li>
        ) : (
          notes.map((n) => (
            <li
              key={n.id}
              className={`sidebar-note${selectedId === n.id ? " selected" : ""}`}
              tabIndex={0}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect(n.id);
              }}
              aria-label={`Select note: ${n.title}`}
            >
              <span className="note-title">{n.title || "Untitled Note"}</span>
              <span className="note-date">{formatDate(n.updated)}</span>
              <button
                className="note-delete"
                title="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(n.id);
                }}
                tabIndex={-1}
                aria-label="Delete note"
              >
                🗑
              </button>
            </li>
          ))
        )}
      </ul>
      <div className="sidebar-footer">
        <span className="note-count">{allNotes.length} total</span>
        <a
          className="sidebar-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          React
        </a>
      </div>
    </nav>
  );
}

// PUBLIC_INTERFACE
/**
 * MainArea: displays selected note (view/edit) or empty state.
 */
function MainArea({
  note,
  editing,
  setEditing,
  onSave,
  onDelete,
  onEdit,
  onBack,
  isMobile,
}) {
  const [local, setLocal] = useState({ title: "", content: "" });

  // Set local form on note/view change
  useEffect(() => {
    setLocal({
      title: note ? note.title : "",
      content: note ? note.content : "",
    });
  }, [note, editing]);

  const handleField = (e) =>
    setLocal((v) => ({ ...v, [e.target.name]: e.target.value }));

  // Submit/save (edit mode)
  const handleSave = () => {
    if (!local.title.trim() && !local.content.trim()) return;
    onSave(note.id, {
      title: local.title || "Untitled Note",
      content: local.content,
    });
    setEditing(false);
  };

  if (!note)
    return (
      <main className="main-area empty">
        <div className="main-empty">
          <h2>No note selected</h2>
          <p>Select a note or create a new note to get started.</p>
        </div>
      </main>
    );

  return (
    <main className="main-area">
      <div className="main-header">
        {isMobile && (
          <button className="main-back" onClick={onBack} title="Open sidebar">
            ☰
          </button>
        )}
        {editing ? (
          <input
            className="main-title-edit"
            name="title"
            value={local.title}
            onChange={handleField}
            placeholder="Note title"
            autoFocus
            maxLength={128}
          />
        ) : (
          <h2 className="main-title">{note.title || "Untitled Note"}</h2>
        )}
        <div className="main-actions">
          {editing ? (
            <>
              <button
                className="btn-secondary"
                onClick={() => setEditing(false)}
                title="Cancel"
              >
                Cancel
              </button>
              <button
                className="btn-accent"
                onClick={handleSave}
                disabled={local.title.trim() === "" && local.content.trim() === ""}
                title="Save"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button className="btn-primary" onClick={onEdit} title="Edit note">
                Edit
              </button>
              <button
                className="btn-danger"
                onClick={() => onDelete(note.id)}
                title="Delete note"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          className="main-content-edit"
          name="content"
          value={local.content}
          onChange={handleField}
          placeholder="Type your note content here…"
          rows={16}
        />
      ) : (
        <div className="main-content" tabIndex={0}>
          {note.content ? (
            <span>{note.content}</span>
          ) : (
            <span className="dimmed">No content.</span>
          )}
        </div>
      )}
      <div className="main-footer">
        <span className="main-meta">
          Last updated: <span>{formatDate(note.updated)}</span>
        </span>
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
/**
 * Format date for note meta.
 */
function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d)) return "";
  const now = new Date();
  const today =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  return today
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
}

export default App;
