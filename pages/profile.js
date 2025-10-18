import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.push("/auth");
        return;
      }
      setUser(data.session.user);
      setLoading(false);
    };
    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              {user.email}
            </div>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm">
              {user.id}
            </div>
          </div>

          {/* Auth Provider(s) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sign-in Methods
            </label>
            <div className="space-y-2">
              {user.identities && user.identities.length > 0 ? (
                user.identities.map((identity) => (
                  <div
                    key={identity.id}
                    className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {identity.provider === "github" ? (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>GitHub</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {identity.identity_data?.user_name ||
                            identity.identity_data?.email}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Email / Password</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email / Password
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Created */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Created
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* Last Sign In */}
          {user.last_sign_in_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Sign In
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                {new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
