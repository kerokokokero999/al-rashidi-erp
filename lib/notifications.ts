import { prisma } from "./prisma";

export async function createNotification({
  title,
  message,
  type,
  link,
}: {
  title: string;
  message: string;
  type: "ORDER" | "PURCHASE" | "LOW_STOCK";
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: { title, message, type, link },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}