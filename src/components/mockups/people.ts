import sarah from "@/assets/people/sarah-chen.jpg";
import marcus from "@/assets/people/marcus-lee.jpg";
import ana from "@/assets/people/ana-costa.jpg";
import tom from "@/assets/people/tom-park.jpg";
import jade from "@/assets/people/jade-wright.jpg";
import daniel from "@/assets/people/daniel-osei.jpg";
import alex from "@/assets/people/alex-rivera.jpg";
import nia from "@/assets/people/nia-adeyemi.jpg";

/** Demo headshots so the walkthrough shows a populated, real-looking org. */
export const PHOTOS: Record<string, string> = {
  "Sarah Chen": sarah,
  "Marcus Lee": marcus,
  "Ana Costa": ana,
  "Tom Park": tom,
  "Jade Wright": jade,
  "Daniel Osei": daniel,
  "Alex Rivera": alex,
  "Nia Adeyemi": nia,
};

const BY_INITIALS: Record<string, string> = {
  SC: sarah, ML: marcus, AC: ana, TP: tom, JW: jade, DO: daniel, AR: alex, NA: nia,
};

export const photoFor = (nameOrInitials?: string): string | undefined => {
  if (!nameOrInitials) return undefined;
  return PHOTOS[nameOrInitials] ?? BY_INITIALS[nameOrInitials.toUpperCase()];
};
