import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

type LogAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

export async function logActivity({
  action,
  entity,
  entityId,
  description,
  metadata,
}: {
  action: LogAction;
  entity: string;
  entityId?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const user = await getCurrentUser();

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId ? Number(entityId) : null,
        description: description || null,
        userId: user?.id || null,
        userName: user?.name || null,
        userEmail: user?.email || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}