import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export default async function UsersPage() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) {
        redirect("/signin");
    }
    return (
        <div>
            <h1>Users</h1>
        </div>
    )
}
