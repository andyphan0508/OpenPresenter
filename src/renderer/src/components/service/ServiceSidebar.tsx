import { useCurrentPresentation } from '../../hooks/useSelectors'
import { PresentationList } from './PresentationList'
import { ServiceItemList } from './ServiceItemList'

export function ServiceSidebar() {
  const pres = useCurrentPresentation()
  return (
    <div className="flex h-full flex-col">
      <PresentationList />
      <div className="flex min-h-0 flex-1 flex-col border-t border-line">
        <h3 className="panel-title truncate px-3 pb-1 pt-2">{pres ? `Thứ tự · ${pres.name}` : 'Thứ tự chương trình'}</h3>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ServiceItemList />
        </div>
      </div>
    </div>
  )
}
