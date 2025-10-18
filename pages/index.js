import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-10">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">
        Welcome to Theme-a-roo Online
      </h1>
      <p className="text-lg text-gray-600">
        Use{" "}
        <Link
          href="/auth"
          className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
        >
          Auth
        </Link>{" "}
        to sign in and{" "}
        <Link
          href="/dids"
          className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
        >
          DIDs
        </Link>{" "}
        to manage items.
      </p>
    </div>
  );
}
