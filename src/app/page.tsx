import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function Home() {
  // Check if user is logged in
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  if (session) {
    // If logged in, go to dashboard
    redirect("/dashboard");
  }

  // Otherwise go to login
  redirect("/login");
}