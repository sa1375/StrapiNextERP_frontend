import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    jwt?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    jwt: string;
  }

  interface JWT {
    id: string;
    jwt: string;
  }
}

// export interface ExtendedSession extends NextAuth.Session {
//   avatar: string;
// }
