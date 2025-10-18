import { useRouter } from "next/router";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage("Check your email for the login link.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Quick redirect if already logged in
  const redirectIfLoggedIn = async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) router.push("/dids");
  };

  if (typeof window !== "undefined") redirectIfLoggedIn();

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all"
            type="submit"
          >
            Send Magic Link
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.includes("Check your email")
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </div>

      <p className="text-center mt-6 text-gray-600 text-sm">
        We'll send you a magic link for a password-free sign in.
      </p>
    </div>
  );
}
