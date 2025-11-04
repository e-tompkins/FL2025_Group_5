import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOption } from "@/app/api/auth/[...nextauth]/route"; // <- use options file

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email;

  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Missing topic" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.visual.delete({
      where: {
        userId_topic: {
          userId: user.id,
          topic,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Delete successful",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to delete visual", details: e.message },
      { status: 500 }
    );
  }
}
