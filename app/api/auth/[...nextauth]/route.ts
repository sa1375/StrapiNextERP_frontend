import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    Credentials({
      name: "Strapi", // The name to display on the sign in form (e.g. "Sign in with...")
      credentials: {
        // `credentials` is used to generate a form on the sign in page.
        // You can specify which fields should be submitted, by adding keys to the `credentials` object.
        // e.g. domain, username, password, 2FA token, etc.
        // You can pass any HTML attribute to the <input> tag through the object.
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
        console.log(
          "URL:",
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`
        );

        // login endpoint
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, //
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              identifier: credentials?.email,
              password: credentials?.password,
            }),
          }
        );

        // response is an object like {jwt:..., {id:1, .... username:.., password:... , ....}}

        // Any object returned will be saved in `user` property of the JWT
        const data = await res.json();

        console.log("credentials received:", credentials);
        console.log("STRAPI URL:", process.env.NEXT_PUBLIC_STRAPI_URL);
        console.log("Strapi response:", data);

        // If you return null then an error will be displayed advising the user to check their details.
        if (!res.ok || !data.jwt) {
          console.error("Strapi login error:", data);
          return null; // 👈 برگردوندن null یعنی 401 برای next-auth
        }

        // return user Object to store in session
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          jwt: data.jwt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.jwt = user.jwt;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.jwt = token.jwt;
      return session;
    },
  },
  pages: {
    signIn: "/login", //custom login page
  },
  secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
