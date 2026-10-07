// Content shared by both landing versions (the dark one at / and the light one at /light).
// Every claim here is checked against the app; change it in one place.
import { SITE_URL } from './consts';
export const title = 'BeeRoll: Transcript Video Editor for Mac | MacPaw';
export const description = 'Edit video by editing its transcript. BeeRoll transcribes on your Mac, cuts by text, adds captions and titles, and exports H.264, HEVC, or ProRes. Free on Setapp.';
export const ogTitle = 'BeeRoll — Edit the words. The video follows.';
export const ogImage = `${SITE_URL}/assets/og/landing.png`;

// Hero copy variants for message-matched ad groups: ?v=captions, ?v=private or ?v=broll.
export const heroVariants = {
  captions: { l1: 'Captions,', l2: 'already typed.', sub: 'BeeRoll turns your transcript into captions, on your Mac.' },
  private:  { l1: 'Transcribe video', l2: 'without uploading it.', sub: 'On-device, free and unlimited. Then cut by deleting words.' },
  broll:    { l1: 'Missing a shot?', l2: 'Describe it.', sub: 'Generate the B-roll you didn’t film and cut it in with your footage.' },
};

// One video's run, as clips on a ruler: editing, generation, layering and keyframes, not just text.
// Every picture is a real 16:10 capture, so the card never crops it. LAYER is a close crop of the timeline
// instead, with the app's own track names beside it, so it's clear what sits on top of what. ANIMATE is just the
// Inspector's keyframed Canvas rows, shown at their own size: the selection box on the preview only got in the way.
export const run: { tc: string; lane: string; title: string; body: string; img: string; alt: string; tracks?: string[][]; size?: number[] }[] = [
  { tc: '00:00:00', lane: 'IMPORT', title: 'Drop in a video.', body: 'Anything your Mac can play.', img: 'run-import', alt: 'The Media tab: an imported video, two AI-generated clips and two titles' },
  { tc: '00:00:09', lane: 'CUT', title: 'Cut by deleting words.', body: 'Transcribed on your Mac. Select a phrase, remove it.', img: 'run-cut', alt: 'A phrase selected in the transcript, with Remove from Edit below' },
  { tc: '00:00:19', lane: 'GENERATE', title: 'Missing a shot? Generate it.', body: 'Describe it, get a take that fits your project.', img: 'run-generate', alt: 'A generated shot of Saturn in the preview, next to the Generate panel' },
  { tc: '00:00:31', lane: 'LAYER', title: 'Stack it on a real timeline.', body: 'Overlays, titles, splits, picture-in-picture.', img: 'run-layer', alt: 'The timeline: a generated Sun shot on Overlay 2, the lower third Saturn on Titles 1, and the video below', tracks: [['OVERLAY 2', 'AI shot'], ['TITLES 1', 'Title'], ['VIDEO', 'Your video']] },
  { tc: '00:00:47', lane: 'ANIMATE', title: 'Move it with keyframes.', body: 'Position, scale, rotation, opacity, speed.', img: 'run-animate', alt: 'The Inspector’s Canvas rows, with keyframes set on X, Scale and Rotation', size: [596, 374] },
  { tc: '00:01:02', lane: 'EXPORT', title: 'Know the size first.', body: 'H.264, HEVC or ProRes.', img: 'run-export', alt: 'The Export Video sheet with formats and size estimates' },
];

// Caption presets (VideoCore SubtitleStyle.Preset), each with a real frame.
export const capPresets = [['standard', 'Standard'], ['boxed', 'Boxed'], ['clean', 'Clean']];

// Rates measured in BeeRoll (SetappAIVideoProvider+Pricing.swift, Sept 2026) and the lengths each model takes.
export const models = [
  { id: 'sora', name: 'Sora 2', rate: 125, lengths: [4, 8, 12] },
  { id: 'veo-fast', name: 'Veo 3.1 Fast', rate: 150, lengths: [4, 8] },
  { id: 'veo', name: 'Veo 3.1', rate: 500, lengths: [4, 8] },
];

export const egress = [
  { what: 'Video and audio', sent: '0 B', state: 'g' },
  { what: 'Transcript and captions', sent: '0 B', state: 'g' },
  { what: 'Shot description', sent: 'when you generate', state: 'o' },
  { what: 'Usage stats', sent: 'anonymous · can be off', state: 'n' },
];

export const faqs = [
  { q: 'Is BeeRoll free?', a: 'Yes. Editing, transcription, captions and export are free. Only AI shots use Setapp AI+ credits.' },
  { q: 'How do I get more AI credits?', a: 'Press Get credits in the Generate panel. They come with Setapp Membership, or you can buy them separately.' },
  { q: 'Is my video uploaded?', a: 'No. It’s transcribed and edited on your Mac. Only a shot description is sent, when you generate.' },
  { q: 'Why does the button open Setapp?', a: 'BeeRoll ships through Setapp, MacPaw’s app platform. It installs and updates BeeRoll, and the same account holds your AI credits.' },
  { q: 'What do I need?', a: 'A Mac with macOS 26 Tahoe or later.' },
];

export const closingPrompts = [
  'Saturn rising over its rings, cinematic',
  'A slow push-in on a desk with a laptop',
  'Drone shot over a foggy pine forest',
];
