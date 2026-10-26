import { NextRequest, NextResponse } from "next/server";
import { DELETE as removeHandler } from "../remove/route";

export async function POST(req: NextRequest) {
  return removeHandler(req);
}

export async function DELETE(req: NextRequest) {
  return removeHandler(req);
}
