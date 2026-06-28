import { Fragment } from 'react';

import MarkdownView from '@/components/learn/MarkdownView';
import RangeTesterIsland from '@/components/tools/RangeTesterIsland';
import CoachVideo from '@/components/artists/CoachVideo';
import SpotlightDrill from '@/components/artists/SpotlightDrill';
import ShareRow from '@/components/artists/ShareRow';

// Renders an artist-profile Markdown body, expanding inline island markers:
//   [[RANGE-TESTER compareTo="…"]] · [[COACH-VIDEO id=… by="…" title="…"]]
//   [[DRILL exerciseId=… key="…"]] · [[SHARE]]
// Markdown between markers renders via the shared MarkdownView (SSG-safe);
// each marker hydrates its island. Markers may sit inside a `> ` blockquote.

const MARKER = /^\s*>?\s*\[\[([A-Z][A-Z-]*)\b([^\]]*)\]\]\s*$/;

function attrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

export default function SpotlightBody({ body, url, shareText }: { body: string; url: string; shareText: string }) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const out: React.ReactNode[] = [];
  let buf: string[] = [];
  let key = 0;

  const flush = () => {
    const md = buf.join('\n').trim();
    buf = [];
    if (md) out.push(<MarkdownView key={`md-${key++}`} content={md} />);
  };

  for (const line of lines) {
    const mk = line.match(MARKER);
    if (!mk) { buf.push(line); continue; }
    flush();
    const [, type, rest] = mk;
    const a = attrs(rest);
    switch (type) {
      case 'RANGE-TESTER':
        out.push(<RangeTesterIsland key={`isl-${key++}`} />);
        break;
      case 'COACH-VIDEO':
        out.push(<CoachVideo key={`isl-${key++}`} id={a.id} by={a.by} title={a.title} />);
        break;
      case 'DRILL':
        if (a.exerciseId) out.push(<SpotlightDrill key={`isl-${key++}`} exerciseId={a.exerciseId} />);
        break;
      case 'SHARE':
        out.push(<ShareRow key={`isl-${key++}`} url={url} text={shareText} />);
        break;
      default:
        break; // unknown marker → drop
    }
  }
  flush();

  return <>{out.map((node, i) => <Fragment key={i}>{node}</Fragment>)}</>;
}
