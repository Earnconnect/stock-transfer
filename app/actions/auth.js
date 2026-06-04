"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createUserSession,
  destroySession,
} from "@/lib/auth";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(prevState, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  if (user.status === "SUSPENDED") {
    return { error: "This account has been suspended. Contact an administrator." };
  }

  await createUserSession(user);
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function registerAction(prevState, formData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (name.length < 2) return { error: "Please enter your full name." };
  if (!emailRe.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: "USER" },
  });

  await createUserSession(user);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
