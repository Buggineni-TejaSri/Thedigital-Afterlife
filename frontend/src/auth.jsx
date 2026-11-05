
import { useState } from "react";
import axios from "axios";
import { BookOpen, Eye, EyeOff, Lock, Mail, User, Sparkles } from "lucide-react";
import "./Auth.css";

const API = "http://localhost:5000/api/auth";

function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/login" : "/register";

      const response = await axios.post(API + endpoint, form);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      onAuth(response.data.user, response.data.token);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to connect. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one"></div>
      <div className="auth-decoration auth-decoration-two"></div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={27} />
          </div>
          <h2>Digital Afterlife</h2>
          <p>Your Knowledge Shouldn't Disappear.</p>
        </div>

        <div className="auth-heading">
          <Sparkles size={20} />
          <h1>{isLogin ? "Welcome Back!" : "Join Our Community"}</h1>
          <p>
            {isLogin
              ? "Continue learning from experiences shared by others."
              : "Share your experiences and inspire others."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
            type="button"
          >
            Login
          </button>

          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label>Full Name</label>
              <div className="auth-input">
                <User size={18} />
                <input
                  name="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <div className="auth-input">
              <Mail size={18} />
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input">
              <Lock size={18} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login to Your Account"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "New to our community?" : "Already have an account?"}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? " Register" : " Login"}
          </button>
        </p>

        <div className="auth-footer">
          Learn from the past. Inspire the future. 💜
        </div>
      </div>
    </div>
  );
}

export default Auth;
