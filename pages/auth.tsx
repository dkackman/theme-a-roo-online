import { Github } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const { user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Quick redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dids");
    }
  }, [user, router]);

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        setMessage("Success! Check your email to confirm your account.");
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        router.push("/dids");
      }
    } catch (err) {
      const error = err as Error;
      setMessage(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    setMessage("");
    setLoading(true);
    try {
      // Use the current origin for redirect (works for both local and production)
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/dids`
          : "/dids";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err) {
      const error = err as Error;
      setMessage(error.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? "Sign up to get started" : "Sign in to your account"}
          </p>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading && "Loading..."}
            {!loading && isSignUp && "Sign Up"}
            {!loading && !isSignUp && "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2">Or continue with</span>
          </div>
        </div>

        {/* GitHub OAuth Button */}
        <button
          onClick={handleGitHubAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Github className="w-5 h-5" />
          GitHub
        </button>

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage("");
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            type="button"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={
              message.includes("Success") ||
              message.includes("Check your email")
                ? "mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800"
                : "mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800"
            }
          >
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
