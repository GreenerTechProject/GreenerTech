import { createFileRoute } from '@tanstack/react-router'
import AlertsPage from '../components/alerts/AlertsPage'

export const Route = createFileRoute('/alerts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AlertsPage />
}
