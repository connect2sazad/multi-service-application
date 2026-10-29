
import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_URL = (
  process.env.REACT_APP_API_URL || '/api'
).replace(/\/+$/, '');

function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todos, setTodos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedTodo = todos.find(
    (todo) => todo._id === selectedId
  );

  // Fetch all todos from MongoDB through Express.
  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/todos`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch todos');
      }

      setTodos(result.data || []);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Check your backend and API URL.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Create a new todo or update the selected todo.
  async function handleSubmit(e) {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      setError('Please enter a todo title.');
      return;
    }

    const payload = {
      title: cleanTitle,
      description: cleanDescription,
    };

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/todos/${selectedId}`
          : `${API_URL}/todos`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        response.status === 204 ? null : await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || 'Failed to save todo'
        );
      }

      const savedTodo = result?.data;

      if (isEditing) {
        setTodos((previous) =>
          previous.map((todo) =>
            todo._id === selectedId
              ? { ...todo, ...savedTodo }
              : todo
          )
        );
      } else if (savedTodo) {
        setTodos((previous) => [
          savedTodo,
          ...previous.filter(
            (todo) => todo._id !== savedTodo._id
          ),
        ]);
        setSelectedId(savedTodo._id);
      }

      setTitle('');
      setDescription('');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleSelect(todo) {
    setSelectedId(todo._id);
    setTitle(todo.title || '');
    setDescription(todo.description || '');
    setIsEditing(false);
    setError('');
  }

  function handleEdit() {
    if (!selectedTodo) return;

    setTitle(selectedTodo.title || '');
    setDescription(selectedTodo.description || '');
    setIsEditing(true);
    setError('');
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to delete todo');
      }

      setTodos((previous) =>
        previous.filter((todo) => todo._id !== id)
      );

      if (selectedId === id) {
        setSelectedId(null);
        setTitle('');
        setDescription('');
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleCompleted(todo) {
    const updatedCompleted = !todo.completed;
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/todos/${todo._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: updatedCompleted,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      setTodos((previous) =>
        previous.map((item) =>
          item._id === todo._id
            ? { ...item, ...result.data }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setTitle('');
    setDescription('');
    setIsEditing(false);
    setError('');
  }

  const pendingCount = todos.filter(
    (todo) => !todo.completed
  ).length;

  return (
    <div className="App">
      <header className="heading">
        <h1>Todos</h1>
        <span className="todo-count">
          {pendingCount} tasks left
        </span>
      </header>

      <main className="main">
        <section className="left">
          <h2>{isEditing ? 'Edit Todo' : 'Create New Todo'}</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="Todo title here..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Briefly describe your todo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create'}
              </button>

              {(isEditing || title || description) && (
                <button
                  type="button"
                  className="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="middle">
          <h2>All Todos ({todos.length})</h2>

          {loading ? (
            <p>Loading todos...</p>
          ) : todos.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p>No todos yet.</p>
              <small>Create your first todo to get started!</small>
            </div>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li
                  key={todo._id}
                  className={`todo-item ${
                    selectedId === todo._id ? 'selected' : ''
                  } ${todo.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`Mark ${todo.title} as completed`}
                    checked={Boolean(todo.completed)}
                    onChange={() => toggleCompleted(todo)}
                  />

                  <button
                    type="button"
                    className="todo-select"
                    onClick={() => handleSelect(todo)}
                  >
                    <span className="todo-title">
                      {todo.title}
                    </span>
                    <small>
                      {todo.completed ? 'Completed' : 'Pending'}
                    </small>
                  </button>

                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label={`Delete ${todo.title}`}
                    onClick={() => handleDelete(todo._id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="refresh-button"
            onClick={fetchTodos}
            disabled={loading}
          >
            Refresh Todos
          </button>
        </section>

        <section className="right">
          <h2>Todo Details</h2>

          {selectedTodo ? (
            <div className="details-card">
              <span
                className={`status ${
                  selectedTodo.completed ? 'status-done' : ''
                }`}
              >
                {selectedTodo.completed ? 'Completed' : 'Pending'}
              </span>

              <h3
                className={
                  selectedTodo.completed ? 'detail-completed' : ''
                }
              >
                {selectedTodo.title}
              </h3>

              <p className="detail-description">
                {selectedTodo.description ||
                  'No description provided.'}
              </p>

              <div className="details-actions">
                <button type="button" onClick={handleEdit}>
                  Edit Todo
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompleted(selectedTodo)}
                >
                  {selectedTodo.completed
                    ? 'Mark Pending'
                    : 'Mark Completed'}
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(selectedTodo._id)}
                >
                  Delete Todo
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">👈</span>
              <p>Select a todo</p>
              <small>
                Choose a task from the list to see its details.
              </small>
            </div>
          )}
        </section>
      </main>

      {error && (
        <div className="error-message" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
