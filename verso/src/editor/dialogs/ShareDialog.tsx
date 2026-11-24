import { useState } from 'react';
import { ClipboardCopy, FileDown, Link } from 'lucide-react';
import { useEngine } from '../Editor';
import { useEditor } from '../engine';
import { renderPage } from '../../lib/render';
import { exportProjectFile } from '../../lib/portable';
import { downloadBlob } from '../../lib/download';
import { slug } from '../../lib/ids';
import { PROJECT_FILE_EXT } from '../../lib/projects';
import { toast } from '../../store/app';
import { Modal } from '../../ui/controls';

export default function ShareDialog({ onClose }: { onClose: () => void }) {
  const engine = useEngine();
  const project = useEditor((s) => s.project)!;
  const [busy, setBusy] = useState(false);

  const copyImage = async () => {
    setBusy(true);
    try {
      await engine.saveNow();
      const scale = Math.min(1, 2400 / Math.max(project.width, project.height));
      const { blob } = await renderPage(project, engine.page, { scale, format: 'png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('PNG copied — paste it into any app', 'success');
      onClose();
    } catch (e: any) {
      toast('Clipboard access was blocked by the browser. Use Export instead.', 'error');
      console.warn(e);
    } finally {
      setBusy(false);
    }
  };

  const projectFile = async () => {
    setBusy(true);
    try {
      await engine.saveNow();
      downloadBlob(await exportProjectFile(engine.project), `${slug(project.title)}${PROJECT_FILE_EXT}`);
      toast('Project file downloaded — import it from the dashboard on any device', 'success');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Share" onClose={onClose}>
      <div style={{ display: 'grid', gap: 8 }}>
        <button className="btn block" style={{ justifyContent: 'flex-start', height: 44 }} onClick={copyImage} disabled={busy}>
          <ClipboardCopy size={15} /> Copy current page as image
        </button>
        <button className="btn block" style={{ justifyContent: 'flex-start', height: 44 }} onClick={projectFile} disabled={busy}>
          <FileDown size={15} /> Download editable project file (.verso.json, images embedded)
        </button>
        <button className="btn block" style={{ justifyContent: 'flex-start', height: 44 }} disabled title="Requires optional cloud sync">
          <Link size={15} /> Share link <span className="tag soon" style={{ marginLeft: 'auto' }}>Stage 3 · optional Supabase sync</span>
        </button>
      </div>
      <p className="faint" style={{ fontSize: 12, marginBottom: 0 }}>
        Verso works without an account — designs live in this browser. Link sharing needs a cloud backend, which will be optional.
      </p>
    </Modal>
  );
}
