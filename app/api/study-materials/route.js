import { NextResponse } from "next/server";
import { getDatabaseAsync } from "@/lib/db";
import { listStudyMaterials } from "@/lib/studyMaterialStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const database = await getDatabaseAsync();
    const [topicsResult, materials] = await Promise.all([
      database.prepare(`SELECT id, name, link, description, parent_id AS parentId, created_at AS createdAt FROM study_material_topics ORDER BY created_at DESC`).all(),
      listStudyMaterials(database),
    ]);
    const allTopics = topicsResult.results || [];
    const topicNodes = new Map(
      allTopics.map((topic) => [topic.id, { ...topic, children: [] }]),
    );
    const topics = [];
    for (const topic of topicNodes.values()) {
      if (topic.parentId) {
        const parent = topicNodes.get(topic.parentId);
        if (parent) parent.children.push(topic);
      } else {
        topics.push(topic);
      }
    }
    for (const topic of topics) {
      topic.materials = materials.filter((material) => material.topicId === topic.id);
    }
    return NextResponse.json({
      success: true,
      studyMaterials: materials,
      topics,
      ungroupedMaterials: materials.filter((material) => !material.topicId),
    });
  } catch (error) {
    console.error("Loading study materials failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load study materials." },
      { status: 500 },
    );
  }
}
