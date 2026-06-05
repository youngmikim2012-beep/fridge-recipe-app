import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOwned(id: string, userId: string) {
  return prisma.savedRecipe.findFirst({ where: { id, userId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwned(id, session.user.id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, string> = {};
  if (body.memo !== undefined) updates.memo = body.memo;
  if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);

  await prisma.savedRecipe.update({ where: { id }, data: updates });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const row = await getOwned(id, session.user.id);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.savedRecipe.delete({ where: { id } });
  return Response.json({ ok: true });
}
