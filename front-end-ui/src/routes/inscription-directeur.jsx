import { createFileRoute } from '@tanstack/react-router'
import InscriptionDirecteur from '../components/Inscription/InscriptionDirecteur'

export const Route = createFileRoute('/inscription-directeur')({
  component: RouteComponent,
})


function RouteComponent() {
  return <InscriptionDirecteur/>
}
