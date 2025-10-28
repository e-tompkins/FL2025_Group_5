import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import VisualList from "./components/VisualList";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "My Visuals",
  description: "A list of your uploaded visuals",
};

export default async function MyVisualsPage() {
  const session = await getServerSession(authOption);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const userEmail = session.user.email;
  if (!userEmail) {
    redirect("/api/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  if (!dbUser) {
    redirect("/api/auth/signin");
  }

  const visuals = await prisma.visual.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      html: true,
      modelUsed: true,
      createdAt: true,
    },
  });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>My Visuals</h1>
      <p style={{ color: "#555", marginTop: 0 }}>
        A list of your saved visuals (topic, model used, and the rendered HTML).
      </p>

      <div style={{ marginTop: 20 }}>
        <VisualList visuals={visuals} />
      </div>
    </main>
  );
}
