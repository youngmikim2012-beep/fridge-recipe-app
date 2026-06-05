import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return Response.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hash, nickname: nickname || null },
  });

  return Response.json({ id: user.id, email: user.email }, { status: 201 });
}
