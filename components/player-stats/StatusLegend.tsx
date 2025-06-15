export default function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-4 my-4 text-sm text-gray-600">
      <div className="font-medium">Status Legend:</div>
      <div className="flex items-center">
        <span className="inline-block w-4 h-4 bg-green-100 text-green-500 rounded-full text-center font-bold mr-1">
          ✓
        </span>
        <span>Selected in 22</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-4 h-4 bg-blue-100 text-blue-500 rounded-full text-center font-bold mr-1">
          V
        </span>
        <span>VFL Listed</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-4 h-4 bg-red-100 text-red-500 rounded-full text-center font-bold mr-1">✕</span>
        <span>Suspended</span>
      </div>
      <div className="flex items-center">
        <span className="inline-block w-4 h-4 bg-yellow-100 text-yellow-500 rounded-full text-center font-bold mr-1">
          !
        </span>
        <span>Injured</span>
      </div>
    </div>
  )
}
