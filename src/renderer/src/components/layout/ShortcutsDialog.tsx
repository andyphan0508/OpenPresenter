import { Kbd } from '../ui/Kbd'
import { Modal } from '../ui/Modal'

const SHORTCUTS: [string, string][] = [
  ['→  ↓  Space  PageDown', 'Slide kế tiếp'],
  ['←  ↑  PageUp', 'Slide trước'],
  ['Bấm vào slide', 'Chiếu ngay slide đó'],
  ['Bấm đúp vào slide', 'Mở slide trong chế độ Soạn thảo'],
  ['F1  /  Esc', 'Xóa hết (màn hình đen)'],
  ['F2', 'Xóa chữ (giữ nền)'],
  ['F3', 'Xóa nền / media'],
  ['F4', 'Xóa props (logo…)'],
  ['F5', 'Xóa tin nhắn']
]

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Phím tắt" onClose={onClose} width="w-[460px]">
      <ul className="divide-y divide-line">
        {SHORTCUTS.map(([keys, action]) => (
          <li key={keys} className="flex items-center justify-between py-2">
            <span className="flex gap-1">
              {keys.split('  ').map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
            <span className="text-fg-2">{action}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">F1–F5 hoạt động cả khi đang gõ chữ, để luôn có thể tắt màn hình kịp thời.</p>
    </Modal>
  )
}
