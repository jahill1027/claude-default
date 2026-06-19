import { equipment } from '@/data';
import type { EquipmentItem } from '@/schema';
import { useDraftStore } from '@/state/draftStore';

const bodyArmor = equipment.filter(
  (e) => e.armor && e.armor.category !== 'shield',
);
const shield = equipment.find((e) => e.armor?.category === 'shield');

/**
 * v1 implements the simple path: pick body armour (single) and optionally a
 * shield, which is what AC needs. The full class equipment-kit tree and the
 * gold/shop path are deferred.
 */
export function EquipmentStep() {
  const draft = useDraftStore((s) => s.draft);
  const patch = useDraftStore((s) => s.patch);

  const equippedBody = draft.equipment.find((e) => {
    const def = equipment.find((d) => d.id === e.defId);
    return def?.armor && def.armor.category !== 'shield';
  });
  const hasShield = draft.equipment.some((e) => e.defId === shield?.id);

  function setBody(defId: string | null) {
    const items: EquipmentItem[] = [];
    if (defId) items.push({ defId, quantity: 1, equipped: true });
    if (hasShield && shield) items.push({ defId: shield.id, quantity: 1, equipped: true });
    patch({ equipment: items });
  }

  function toggleShield() {
    const items = draft.equipment.filter((e) => e.defId !== shield?.id);
    if (!hasShield && shield) items.push({ defId: shield.id, quantity: 1, equipped: true });
    patch({ equipment: items });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 font-semibold text-fg">Armor</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setBody(null)}
            className={`rounded-lg border p-3 text-left text-sm transition-colors ${
              !equippedBody
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-line bg-surface hover:border-primary/50'
            }`}
          >
            <div className="font-medium text-fg">None (unarmored)</div>
            <div className="text-xs text-muted">AC 10 + Dex</div>
          </button>
          {bodyArmor.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setBody(a.id)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                equippedBody?.defId === a.id
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-line bg-surface hover:border-primary/50'
              }`}
            >
              <div className="font-medium text-fg">{a.name}</div>
              <div className="text-xs capitalize text-muted">
                {a.armor!.category} · base AC {a.armor!.baseAc}
                {a.armor!.dexBonus === 'capped' && ' + Dex (max 2)'}
                {a.armor!.dexBonus === 'full' && ' + Dex'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {shield && (
        <label className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
          <input
            type="checkbox"
            checked={hasShield}
            onChange={toggleShield}
            className="h-4 w-4 accent-[rgb(var(--color-primary))]"
          />
          <span className="text-sm">
            <span className="font-medium text-fg">Shield</span>
            <span className="ml-2 text-muted">+2 AC</span>
          </span>
        </label>
      )}

      <p className="text-sm text-muted">
        Weapons and the full class equipment kit come later; armour and shield are
        enough to compute Armor Class for the sheet.
      </p>
    </div>
  );
}
