import { createFileRoute } from '@tanstack/react-router'
import Connexion from '../components/connexion/Connexion.jsx'

export const Route = createFileRoute('/connexion')({
  component: RouteComponent,
})

function RouteComponent() {
  return   <div><Connexion/></div>   
}
