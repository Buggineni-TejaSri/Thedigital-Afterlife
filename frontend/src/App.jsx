import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  Heart,
  Lightbulb,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Calendar,
  User,
  BookHeart,
  Sparkles,
  Layers,
  LogOut,
  Bookmark,
  LayoutDashboard,
  Eye,
  MessageCircle,
  Send
} from "lucide-react";
import Auth from "./auth";
import "./App.css";

const API = "http://localhost:5000/api";

const categories = [
  "Personal",
  "Family",
  "Education",
  "Experience",
  "Skills",
  "Memories",
  "Life Lessons",
  "Career",
  "Relationships",
  "Other"
];

const emptyForm = {
  title: "",
  category: "Memories",
  content: ""
};

function App() {
  const [knowledge, setKnowledge] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || ""
  );

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bookmarks")) || [];
    } catch {
      return [];
    }
  });

  // Authentication headers
  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const currentUserId = user?.id || user?._id;

  // Fetch all public stories
  const fetchKnowledge = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API}/knowledge`);

      setKnowledge(response.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load stories. Please make sure the backend and MongoDB are running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // Refresh a selected story
  const refreshSelectedStory = async (id) => {
    const response = await axios.get(`${API}/knowledge/${id}`);

    setSelectedStory(response.data);
    await fetchKnowledge();
  };

  const refreshSelectedStoryIfOpen = async (id) => {
    if (selectedStory?._id === id) {
      await refreshSelectedStory(id);
    } else {
      await fetchKnowledge();
    }
  };

  // Login success
  const handleAuth = (loggedInUser, loginToken) => {
    setUser(loggedInUser);
    setToken(loginToken);
    setShowAuth(false);

    localStorage.setItem("user", JSON.stringify(loggedInUser));
    localStorage.setItem("token", loginToken);

    fetchKnowledge();
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken("");
    setShowAuth(false);
    setShowForm(false);
    setEditingId(null);
    setSelectedStory(null);
    setActivePage("Dashboard");
  };

  // Require login for protected actions
  const requireLogin = () => {
    if (!user || !token) {
      setShowAuth(true);
      return false;
    }

    return true;
  };

  // Bookmarks
  const toggleBookmark = (id) => {
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((item) => item !== id)
      : [...bookmarks, id];

    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
  };

  // Check story ownership
  const isOwner = (story) => {
    const ownerId = story.createdBy?._id || story.createdBy;

    return Boolean(
      user &&
      ownerId &&
      String(ownerId) === String(currentUserId)
    );
  };

  // Check whether current user liked a story
  const hasLiked = (story) => {
    return (story.likes || []).some((like) => {
      const likeId = like?._id || like;

      return String(likeId) === String(currentUserId);
    });
  };

  // Like and unlike
  const handleLike = async (story) => {
    if (!requireLogin()) return;

    try {
      const method = hasLiked(story) ? "delete" : "post";

      await axios({
        method,
        url: `${API}/knowledge/${story._id}/like`,
        headers: authHeaders
      });

      await refreshSelectedStoryIfOpen(story._id);
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to update like."
      );
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!requireLogin()) return;
    if (!commentText.trim() || !selectedStory) return;

    try {
      setActionLoading(true);

      await axios.post(
        `${API}/knowledge/${selectedStory._id}/comments`,
        { text: commentText },
        { headers: authHeaders }
      );

      setCommentText("");

      await refreshSelectedStory(selectedStory._id);
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to add comment."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Delete own comment
  const handleDeleteComment = async (storyId, commentId) => {
    if (!requireLogin()) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API}/knowledge/${storyId}/comments/${commentId}`,
        { headers: authHeaders }
      );

      await refreshSelectedStory(storyId);
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to delete comment."
      );
    }
  };

  // Search, category and page filtering
  const filteredKnowledge = useMemo(() => {
    return knowledge.filter((item) => {
      const text = `${item.title || ""} ${item.content || ""} ${item.author || ""}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || item.category === category;

      let matchesPage = true;

      if (activePage === "Memories") {
        matchesPage = item.category === "Memories";
      } else if (activePage === "Life Lessons") {
        matchesPage = item.category === "Life Lessons";
      } else if (activePage === "Bookmarks") {
        matchesPage = bookmarks.includes(item._id);
      }

      return matchesSearch && matchesCategory && matchesPage;
    });
  }, [knowledge, search, category, activePage, bookmarks]);

  const memoryCount = knowledge.filter(
    (item) => item.category === "Memories"
  ).length;

  const lessonCount = knowledge.filter(
    (item) => item.category === "Life Lessons"
  ).length;

  // Open add story form
  const openAddForm = () => {
    if (!requireLogin()) return;

    setEditingId(null);

    setForm({
      ...emptyForm,
      category:
        activePage === "Memories" || activePage === "Life Lessons"
          ? activePage
          : "Memories"
    });

    setError("");
    setShowForm(true);
  };

  // Edit story
  const handleEdit = (story) => {
    if (!isOwner(story)) return;

    setEditingId(story._id);

    setForm({
      title: story.title,
      category: story.category,
      content: story.content
    });

    setError("");
    setSelectedStory(null);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Publish or update story
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!requireLogin()) return;

    try {
      if (editingId) {
        await axios.put(
          `${API}/knowledge/${editingId}`,
          form,
          { headers: authHeaders }
        );
      } else {
        await axios.post(
          `${API}/knowledge`,
          form,
          { headers: authHeaders }
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchKnowledge();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save your story."
      );
    }
  };

  // Delete story
  const handleDelete = async (story) => {
    if (!isOwner(story)) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this story?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API}/knowledge/${story._id}`,
        { headers: authHeaders }
      );

      setSelectedStory(null);
      await fetchKnowledge();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to delete story."
      );
    }
  };

  // Open full story
  const openStory = async (story) => {
    try {
      const response = await axios.get(
        `${API}/knowledge/${story._id}`
      );

      setSelectedStory(response.data);
      setCommentText("");
    } catch (err) {
      console.error(err);
      alert("Unable to open this story.");
    }
  };

  // Change sidebar page
  const changePage = (page) => {
    setActivePage(page);
    setCategory("All");
    setSearch("");
    setShowForm(false);
    setSelectedStory(null);
  };

  const pageTitle = {
    Dashboard: "Community Dashboard",
    "Knowledge Library": "Knowledge Library",
    Memories: "Memories",
    "Life Lessons": "Life Lessons",
    Bookmarks: "Your Bookmarks"
  };

  if (showAuth) {
    return <Auth onAuth={handleAuth} />;
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={25} />
          </div>

          <div>
            <h2>Digital Afterlife</h2>
            <span>Knowledge Lives Forever</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">EXPLORE</p>

          {[
            ["Dashboard", LayoutDashboard],
            ["Knowledge Library", BookOpen],
            ["Memories", Heart],
            ["Life Lessons", Lightbulb],
            ["Bookmarks", Bookmark]
          ].map(([page, Icon]) => (
            <button
              key={page}
              className={`side-link ${activePage === page ? "active" : ""}`}
              onClick={() => changePage(page)}
            >
              <Icon size={19} />
              {page}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <Sparkles size={20} />
            <p>Every experience has something to teach.</p>
          </div>

          {user ? (
            <div className="sidebar-user">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{user.name}</strong>
                <span>Community Member</span>
              </div>

              <button
                className="icon-button"
                title="Logout"
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              className="sidebar-login"
              onClick={() => setShowAuth(true)}
            >
              <User size={18} />
              Login / Register
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">
              WELCOME TO YOUR COMMUNITY
            </span>

            <h2>{pageTitle[activePage]}</h2>
          </div>

          <div className="topbar-actions">
            {user ? (
              <span className="welcome-user">
                Hello, {user.name}!
              </span>
            ) : (
              <button
                className="login-button"
                onClick={() => setShowAuth(true)}
              >
                Login / Register
              </button>
            )}

            <button className="add-button" onClick={openAddForm}>
              <Plus size={18} />
              Share Your Story
            </button>
          </div>
        </header>

        {/* HERO */}
        {activePage === "Dashboard" && (
          <section className="hero">
            <div className="hero-content">
              <span className="hero-tag">
                <Sparkles size={15} />
                A COMMUNITY OF EXPERIENCES
              </span>

              <h1>
                Your Knowledge
                <br />
                Shouldn't Disappear.
              </h1>

              <p>
                Discover real experiences, meaningful memories and
                valuable life lessons shared by people around the world.
                Your story might inspire someone's tomorrow.
              </p>

              <button className="hero-button" onClick={openAddForm}>
                Share Your Experience <Plus size={17} />
              </button>
            </div>

            <div className="hero-decoration">
              <BookHeart size={105} strokeWidth={1.1} />
              <Sparkles className="hero-sparkle" size={30} />
            </div>
          </section>
        )}

        {/* STATISTICS */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">
              <Layers size={22} />
            </div>

            <div>
              <span>Total Stories</span>
              <h2>{knowledge.length}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pink">
              <Heart size={22} />
            </div>

            <div>
              <span>Memories</span>
              <h2>{memoryCount}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <Lightbulb size={22} />
            </div>

            <div>
              <span>Life Lessons</span>
              <h2>{lessonCount}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <Bookmark size={22} />
            </div>

            <div>
              <span>Bookmarks</span>
              <h2>{bookmarks.length}</h2>
            </div>
          </div>
        </section>

        {/* INTRO */}
        <section className="section-heading">
          <div>
            <h2>
              {activePage === "Dashboard"
                ? "Explore Community Stories"
                : pageTitle[activePage]}
            </h2>

            <p>
              Read, discover and learn from experiences shared by others.
            </p>
          </div>
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="filter-bar">
          <div className="search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search stories, experiences or authors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="All">All Categories</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        {/* ERROR */}
        {error && !showForm && (
          <div className="error-message">
            {error}
            <button onClick={fetchKnowledge}>Retry</button>
          </div>
        )}

        {/* STORY LIST */}
        {loading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading community stories...</p>
          </div>
        ) : filteredKnowledge.length > 0 ? (
          <section className="knowledge-grid">
            {filteredKnowledge.map((item) => (
              <article className="knowledge-card" key={item._id}>
                <div className="card-top">
                  <span
                    className={`category-badge ${
                      item.category === "Memories"
                        ? "memory-badge"
                        : item.category === "Life Lessons"
                        ? "lesson-badge"
                        : "general-badge"
                    }`}
                  >
                    {item.category}
                  </span>

                  <button
                    className={`bookmark-button ${
                      bookmarks.includes(item._id) ? "bookmarked" : ""
                    }`}
                    onClick={() => toggleBookmark(item._id)}
                    title="Bookmark story"
                  >
                    <Bookmark size={19} />
                  </button>
                </div>

                <h3>{item.title}</h3>

                <p className="card-description">
                  {item.content?.length > 160
                    ? item.content.substring(0, 160) + "..."
                    : item.content}
                </p>

                <div className="card-author">
                  <div className="author-avatar">
                    {(item.author || "A").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {item.author || "Community Member"}
                    </strong>

                    <span>
                      <Calendar size={12} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* LIKE AND COMMENT COUNTS */}
                <div className="story-social-summary">
                  <span>
                    <Heart size={15} />
                    {item.likes?.length || 0} Likes
                  </span>

                  <span>
                    <MessageCircle size={15} />
                    {item.comments?.length || 0} Comments
                  </span>
                </div>

                <div className="card-actions">
                  <button
                    className="read-button"
                    onClick={() => openStory(item)}
                  >
                    <Eye size={16} />
                    Read Story
                  </button>

                  {isOwner(item) && (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(item)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              {activePage === "Memories" ? (
                <Heart size={35} />
              ) : activePage === "Life Lessons" ? (
                <Lightbulb size={35} />
              ) : (
                <BookOpen size={35} />
              )}
            </div>

            <h3>No stories found</h3>

            <p>
              Be the first to share an experience with the community!
            </p>

            <button className="add-button" onClick={openAddForm}>
              <Plus size={17} />
              Share Your Story
            </button>
          </div>
        )}

        <footer className="app-footer">
          <BookOpen size={17} />

          <p>
            Digital Afterlife — Learn from the past. Inspire the future.
          </p>
        </footer>
      </main>

      {/* ADD / EDIT STORY MODAL */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Your Story" : "Share Your Story"}
                </h2>

                <p>Your experience could help someone.</p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Story Title</label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Give your story a meaningful title"
                required
              />

              <label>Author</label>

              <input value={user?.name || ""} disabled />

              <label>Category</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label>Your Experience / Lesson</label>

              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write your experience, memory or lesson here..."
                rows="7"
                required
              />

              {error && (
                <div className="auth-error">{error}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="save-button">
                  {editingId ? "Update Story" : "Publish Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL STORY VIEW WITH LIKES AND COMMENTS */}
      {selectedStory && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="modal story-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <span className="category-badge general-badge">
                {selectedStory.category}
              </span>

              <button
                className="close-button"
                onClick={() => setSelectedStory(null)}
              >
                <X size={21} />
              </button>
            </div>

            <h2>{selectedStory.title}</h2>

            <div className="story-view-author">
              <User size={16} />
              {selectedStory.author}
              <span>•</span>
              {new Date(selectedStory.createdAt).toLocaleDateString()}
            </div>

            <div className="story-full-content">
              {selectedStory.content}
            </div>

            {/* LIKE BUTTON */}
            <div className="story-interaction-bar">
              <button
                className={`interaction-button ${
                  hasLiked(selectedStory) ? "liked" : ""
                }`}
                onClick={() => handleLike(selectedStory)}
              >
                <Heart
                  size={19}
                  fill={
                    hasLiked(selectedStory) ? "currentColor" : "none"
                  }
                />

                {hasLiked(selectedStory) ? "Liked" : "Like"}
                ({selectedStory.likes?.length || 0})
              </button>

              <span className="interaction-button">
                <MessageCircle size={19} />
                Comments ({selectedStory.comments?.length || 0})
              </span>
            </div>

            {/* COMMENTS */}
            <div className="comments-section">
              <h3>Community Comments</h3>

              {selectedStory.comments?.length > 0 ? (
                selectedStory.comments.map((comment) => {
                  const commentUserId =
                    comment.user?._id || comment.user;

                  const isCommentOwner =
                    user &&
                    String(commentUserId) === String(currentUserId);

                  return (
                    <div className="comment-card" key={comment._id}>
                      <div className="comment-avatar">
                        {(comment.userName || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="comment-content">
                        <strong>
                          {comment.userName || "Community Member"}
                        </strong>

                        <p>{comment.text}</p>

                        <small>
                          {new Date(comment.createdAt).toLocaleString()}
                        </small>
                      </div>

                      {isCommentOwner && (
                        <button
                          className="comment-delete"
                          title="Delete comment"
                          onClick={() =>
                            handleDeleteComment(
                              selectedStory._id,
                              comment._id
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="no-comments">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}

              {/* ADD COMMENT FORM */}
              <form
                className="comment-form"
                onSubmit={handleAddComment}
              >
                <input
                  type="text"
                  placeholder={
                    user
                      ? "Write a meaningful comment..."
                      : "Login to write a comment..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                />

                <button
                  type="submit"
                  disabled={actionLoading || !commentText.trim()}
                >
                  <Send size={17} />
                  Post
                </button>
              </form>
            </div>

            {/* STORY ACTIONS */}
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => toggleBookmark(selectedStory._id)}
              >
                <Bookmark size={16} />

                {bookmarks.includes(selectedStory._id)
                  ? "Remove Bookmark"
                  : "Bookmark"}
              </button>

              {isOwner(selectedStory) && (
                <button
                  className="save-button"
                  onClick={() => handleEdit(selectedStory)}
                >
                  <Pencil size={16} />
                  Edit Story
                </button>
              )}

              {isOwner(selectedStory) && (
                <button
                  className="delete-button"
                  onClick={() => handleDelete(selectedStory)}
                >
                  <Trash2 size={16} />
                  Delete Story
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;