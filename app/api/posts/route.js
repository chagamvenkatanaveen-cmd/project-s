import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { createPost, getPosts } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    const posts = await getPosts(database, user?.id);
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Loading posts failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load posts." }, { status: 500 });
  }
}

export async function POST(req) {
  let database;
  let user;
  try {
    database = getDatabase();
    user = await getCurrentUser(database, req);
  } catch (error) {
    console.error("Post author lookup failed:", error);
    return NextResponse.json({ success: false, error: "Unable to verify your account." }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ success: false, error: "Sign in to publish a post." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: "A valid JSON body is required." }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type : "post";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const tag = typeof body.tag === "string" ? body.tag.trim() : "Discussion";
  const topicValue = typeof body.topic === "string" ? body.topic.trim() : "#Cricket";
  const matchTag = typeof body.matchTag === "string" ? body.matchTag.trim() : "";
  const pollOptions = Array.isArray(body.pollOptions)
    ? body.pollOptions.map((option) => (typeof option === "string" ? option.trim() : ""))
    : [];

  if (!["post", "discussion", "article", "poll"].includes(type)) {
    return NextResponse.json({ success: false, error: "Unsupported post type." }, { status: 400 });
  }
  if (!content || content.length > 10000) {
    return NextResponse.json({ success: false, error: "Post content must be 1–10,000 characters." }, { status: 400 });
  }
  if (title.length > 200 || tag.length > 60 || topicValue.length > 60 || matchTag.length > 120) {
    return NextResponse.json({ success: false, error: "One or more post fields are too long." }, { status: 400 });
  }
  if (type === "article" && !title) {
    return NextResponse.json({ success: false, error: "Articles require a title." }, { status: 400 });
  }
  if (
    type === "poll" &&
    (pollOptions.length < 2 ||
      pollOptions.length > 5 ||
      pollOptions.some((option) => !option || option.length > 120))
  ) {
    return NextResponse.json(
      { success: false, error: "Polls require 2–5 non-empty options, each no longer than 120 characters." },
      { status: 400 },
    );
  }

  const topic = topicValue
    ? topicValue.startsWith("#")
      ? topicValue
      : `#${topicValue}`
    : "#Cricket";

  try {
    const post = await createPost(database, user, {
      title,
      content,
      type,
      tag: tag || "Discussion",
      topic,
      pollOptions,
      matchTag,
    });
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Creating post failed:", error);
    return NextResponse.json({ success: false, error: "Unable to publish the post." }, { status: 500 });
  }
}

