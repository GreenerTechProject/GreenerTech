import { createFileRoute } from '@tanstack/react-router'
import DomainSetupWizard from '../components/directeur-setUp/DomainWizard'

export const Route = createFileRoute('/setUpPageGMaps')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><DomainSetupWizard/></div>
}
