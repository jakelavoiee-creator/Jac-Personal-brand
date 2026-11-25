import { Modal, MOD } from '../../ui/controls';

const ROWS: [string, string][] = [
  ['Undo / Redo', `${MOD}Z  /  ${MOD}⇧Z`],
  ['Copy / Cut / Paste', `${MOD}C  /  ${MOD}X  /  ${MOD}V`],
  ['Duplicate', `${MOD}D`],
  ['Delete', 'Delete / Backspace'],
  ['Select all', `${MOD}A`],
  ['Group / Ungroup', `${MOD}G  /  ${MOD}⇧G`],
  ['Lock / Hide', `${MOD}L  /  ${MOD}⇧H`],
  ['Bring forward / to front', `${MOD}]  /  ${MOD}⇧]`],
  ['Send backward / to back', `${MOD}[  /  ${MOD}⇧[`],
  ['Nudge 1px / 10px', 'Arrows  /  ⇧ Arrows'],
  ['Rotate in 15° steps', 'Hold ⇧ while rotating'],
  ['Pan', 'Hold Space + drag · scroll · middle mouse'],
  ['Zoom', `${MOD}scroll · ${MOD}+ / ${MOD}−`],
  ['Fit / 100%', `${MOD}0  /  ${MOD}1`],
  ['Add text / rectangle / circle / line', 'T  /  R  /  O  /  L'],
  ['Export', `${MOD}⇧E`],
  ['Save now', `${MOD}S (autosave is always on)`],
  ['Paste image from clipboard', `${MOD}V`],
];

export default function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <table className="table">
        <tbody>
          {ROWS.map(([a, b]) => (
            <tr key={a}>
              <td>{a}</td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
