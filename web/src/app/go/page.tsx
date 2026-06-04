import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Post-login router: sends each role to its home surface.
 * Staff land in their console; customers in their dashboard.
 */
export default async function GoPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "ESTIMATOR":
      redirect("/estimator");
    default:
      redirect("/dashboard");
  }
}
