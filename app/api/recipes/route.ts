import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await prisma.savedRecipe.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: "desc" },
  });

  return Response.json(
    recipes.map((r: { id: string; recipe: string; tags: string; memo: string; savedAt: Date }) => ({
      id: r.id,
      recipe: JSON.parse(r.recipe),
      tags: JSON.parse(r.tags),
      memo: r.memo,
      savedAt: r.savedAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.savedRecipe.count({ where: { userId: session.user.id } });
  if (count >= 50) {
    return Response.json({ error: "저장 한도(50개)에 도달했습니다." }, { status: 403 });
  }

  const { recipe, tags = [], memo = "" } = await req.json().catch(() => ({}));
  if (!recipe?.name) {
    return Response.json({ error: "레시피 데이터가 없습니다." }, { status: 400 });
  }

  const saved = await prisma.savedRecipe.create({
    data: {
      userId: session.user.id,
      recipe: JSON.stringify(recipe),
      tags: JSON.stringify(tags),
      memo,
    },
  });

  return Response.json({ id: saved.id }, { status: 201 });
}
