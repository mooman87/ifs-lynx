"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "../styles/login.css";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } else {
      setLoading(false);
      setError(data.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Image
        src="/coming-soon.png"
        alt="Coming Soon"
        width={1000}
        height={725}
        className="max-w-full h-auto opacity-0 animate-fadeIn"
        priority
      />
    </div>
    // <div className="login-page">
    //   <div className="login-container">
    //     {/* Left panel — brand */}
    //     <div className="login-left">
    //       <Image
    //         src="/test.png"
    //         alt="Lynx logo"
    //         height={200}
    //         width={200}
    //         className="login-logo"
    //       />
    //       <p className="login-tagline">
    //         Plan, manage, and execute campaigns at any scale.
    //       </p>
    //     </div>

    //     {/* Right panel — form */}
    //     <div className="login-right">
    //       <div className="login-form-header">
    //         <h1 className="login-title">Welcome back</h1>
    //         <p className="login-subtitle">Sign in to your organization</p>
    //       </div>

    //       {error && <div className="login-error">{error}</div>}

    //       <form className="login-form" onSubmit={handleSubmit}>
    //         <div className="login-field">
    //           <label htmlFor="identifier">Username or email</label>
    //           <input
    //             id="identifier"
    //             type="text"
    //             name="identifier"
    //             placeholder="Enter your username or email"
    //             value={formData.identifier}
    //             onChange={handleChange}
    //             required
    //             autoComplete="identifier"
    //           />
    //         </div>

    //         <div className="login-field">
    //           <label htmlFor="password">Password</label>
    //           <input
    //             id="password"
    //             type="password"
    //             name="password"
    //             placeholder="••••••••"
    //             value={formData.password}
    //             onChange={handleChange}
    //             required
    //             autoComplete="current-password"
    //           />
    //           <a href="#" className="login-forgot">
    //             Forgot password?
    //           </a>
    //         </div>

    //         <button type="submit" className="login-btn">
    //           {loading ? "Loading" : "Sign in"}
    //         </button>
    //       </form>

    //       <div className="login-divider">
    //         <span className="login-divider-line" />
    //         <span className="login-divider-text">or</span>
    //         <span className="login-divider-line" />
    //       </div>

    //       <button
    //         type="button"
    //         className="login-contact-btn"
    //         onClick={() => router.push("/register")}
    //       >
    //         Register for access
    //       </button>
    //     </div>
    //   </div>
    // </div>
  );
}
