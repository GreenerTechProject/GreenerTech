import { createFileRoute } from '@tanstack/react-router'
import InscriptionTechnicien from '../components/Inscription/InscriptionTechnicien'

export const Route = createFileRoute('/inscription-technicien')({
  component: RouteComponent,
})

function RouteComponent() {
  return <InscriptionTechnicien/>
}
