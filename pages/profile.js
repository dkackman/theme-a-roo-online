import { Github, Mail } from "lucide-react";
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
                        <Github className="w-5 h-5" />
                        <span>GitHub</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {identity.identity_data?.user_name ||
                            identity.identity_data?.email}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <span>Email / Password</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
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
