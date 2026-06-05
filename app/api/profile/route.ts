import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, nickname: true, dietary: true, createdAt: true },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ ...user, dietary: JSON.parse(user.dietary) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { nickname, dietary } = await req.json().catch(() => ({}));
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(dietary !== undefined && { dietary: JSON.stringify(dietary) }),
    },
  });

  return Response.json({ ok: true });
}
