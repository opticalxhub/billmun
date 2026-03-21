import "next-auth";
import type { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: UserRole;
      status: UserStatus;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
  }
}