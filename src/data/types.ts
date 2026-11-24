import type { Theme } from "./i18n";

export interface Block { h: string; p: string }
export interface Figure { value: string; label: string }
export interface Link { label: string; href: string; primary?: boolean }
export interface Shot { name: string; w: number; h: number; title: string; file: string; text: string; alt: string }

export interface ProjectText {
  title: string;
  /** Short line under the title: where and how it was made. */
  context: string;
  /** One or two sentences for the index. */
  summary: string;
  /** Headline on the project page. */
  headline: string;
  intro: string;
  /** For team projects: what Bruno did. */
  role?: string;
  notes: Block[];
  figures?: Figure[];
  /** Where a reader can check the figures for themselves. */
  proofs?: Link[];
  links: Link[];
  shots?: Shot[];
  shotsNote?: string;
}

export interface Project {
  slug: string;
  /** Position in the index: lower comes first. */
  order: number;
  /** Hue (0–360) that tints the project's cover and page. */
  hue: number;
  /** The project's colour: fills, its 3D object, the row on hover. */
  color: string;
  /** Text colour that reads on `color`. */
  onColor: string;
  /** Which 3D object stands for the project (see src/scripts/objects.ts); unknown names get the default. */
  object: string;
  /** true: has its own case-study page; false: the index links straight to `repo`. */
  page: boolean;
  themes: Theme[];
  repo?: string;
  /** Only for projects that have the NetDoctor rules demo. */
  demo?: boolean;
  pt: ProjectText;
  en: ProjectText;
}
