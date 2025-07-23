import { createFileRoute } from '@tanstack/react-router'
import InterventionsPage from '../components/interventions/InterventionsPage'

export const Route = createFileRoute('/interventions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <InterventionsPage />
}
