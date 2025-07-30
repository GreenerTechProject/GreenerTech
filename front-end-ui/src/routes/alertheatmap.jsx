import { createFileRoute } from '@tanstack/react-router'
import AlertHeatMap from '../components/map/AlertHeatMap'

export const Route = createFileRoute('/alertheatmap')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><AlertHeatMap/></div>
}
