import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"

export const authClient = createAuthClient({

    baseURL: "http://localhost:3000",
    plugins: [inferAdditionalFields({
        user: {
          phone: {
            type: "string",
            required: true,
          },
          role: {
            type: "string",
            required: true,
          },
          mentorType: {
            type: "string",
            required: false,
          },
        }
    })],
}) 



export const { useSession, signIn, signUp, signOut, getSession} = authClient
 