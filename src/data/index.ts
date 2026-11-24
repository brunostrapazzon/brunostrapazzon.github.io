import type { Project } from "./types";

// Every file in ./projects is a project; to add one, create a file there.
const files = import.meta.glob<{ default: Project }>("./projects/*.ts", { eager: true });
export const projects: Project[] = Object.values(files)
  .map((m) => m.default)
  .sort((a, b) => a.order - b.order);

export const pageProjects = projects.filter((p) => p.page);
